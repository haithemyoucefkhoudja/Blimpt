import React, { useCallback, useEffect, useRef, useState } from "react";
import { listen, emit } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  ArrowUpRight,
  Check,
  Crop,
  Download,
  Palette,
  Pencil,
  Redo,
  Square,
  Type,
  Undo,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import {
  CropData,
  DrawingElement,
  ScreenshotData,
  Tool,
} from "@/types/drawing";
function Screenshot() {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [screenshotData, setScreenshotData] = useState<ScreenshotData[]>([]);
  const [currentScreenshotIndex, setCurrentScreenshotIndex] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [currentTool, setCurrentTool] = useState<Tool>("select");
  const [currentColor, setCurrentColor] = useState("#ff0000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentElement, setCurrentElement] = useState<DrawingElement | null>(
    null
  );
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [cropArea, setCropArea] = useState<CropData | null>(null);
  const [isImageChanged, setIsImageChanged] = useState(false);
  const [actionType, setActionType] = useState<"undo" | "redo" | null>(null);
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [isResizingCrop, setIsResizingCrop] = useState<string | null>(null);
  const [cursorStyle, setCursorStyle] = useState("crosshair");
  const [isHoveringCrop, setIsHoveringCrop] = useState(false);
  const [hoverHandle, setHoverHandle] = useState<string | null>(null);
  const currentIndexRef = useRef(currentScreenshotIndex);
  const [dragStarted, setDragStarted] = useState(false);
  const MIN_DRAG_DISTANCE = 5;
  const [cropControlsPosition, setCropControlsPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [cropDimensions, setCropDimensions] = useState<string>("");
  const colorPresets = [
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#ff00ff",
    "#00ffff",
    "#000000",
    "#ffffff",
  ];

  const currentScreenshot = screenshotData[currentScreenshotIndex];
  const currentElements = currentScreenshot?.elements || [];
  useEffect(() => {
    currentIndexRef.current = currentScreenshotIndex;
  }, [currentScreenshotIndex]);
  const addNewState = (newState: ScreenshotData) => {
    setScreenshotData((prev) => {
      const newHistory = prev.slice(0, currentScreenshotIndex + 1);
      return [...newHistory, newState];
    });
    setCurrentScreenshotIndex((prev) => prev + 1);
  };

  const canUndo = currentScreenshotIndex > 0;
  const canRedo = currentScreenshotIndex < screenshotData.length - 1;

  const handleUndo = () => {
    const currentIndex = currentIndexRef.current;
    if (canUndo) {
      setCurrentScreenshotIndex((prev) => prev - 1);
      setCropArea(null); // Clear active crop when undoing
      const currentImage = screenshotData[currentIndex].image;
      const prevImage = screenshotData[currentIndex - 1].image;
      if (prevImage !== currentImage) {
        setIsImageChanged(true);
      }
    }
  };
  const handleRedo = () => {
    const currentIndex = currentIndexRef.current;
    if (canRedo) {
      setCurrentScreenshotIndex((prev) => prev + 1);
      const nextImage = screenshotData[currentIndex + 1].image;
      const currentImage = screenshotData[currentIndex].image;
      if (nextImage !== currentImage) {
        setIsImageChanged(true);
      }
    }
  };

  const applyCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas || !cropArea) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = cropArea.width;
    croppedCanvas.height = cropArea.height;
    const croppedCtx = croppedCanvas.getContext("2d");

    if (croppedCtx) {
      croppedCtx.drawImage(
        canvas,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height
      );

      const croppedImage = croppedCanvas.toDataURL("image/png");

      const adjustedElements = currentElements
        .filter((element) => {
          if (element.type === "text") {
            return (
              element.x >= cropArea.x &&
              element.x <= cropArea.x + cropArea.width &&
              element.y >= cropArea.y &&
              element.y <= cropArea.y + cropArea.height
            );
          }
          return true;
        })
        .map((element) => ({
          ...element,
          x: element.x - cropArea.x,
          y: element.y - cropArea.y,
          ...(element.points && {
            points: element.points.map((point) => ({
              x: point.x - cropArea.x,
              y: point.y - cropArea.y,
            })),
          }),
        }));

      const newState: ScreenshotData = {
        image: croppedImage,
        elements: adjustedElements,
      };

      addNewState(newState);
      setIsImageChanged(true);
      setCropArea(null);
    }
  };

  useEffect(() => {
    if (isImageChanged) {
      setImageLoaded(false);
      setIsImageChanged(false);
    }
  }, [isImageChanged]);
  const cancelCrop = () => {
    setCropArea(null);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL("image/png");
    emit("cropped_image", dataURL);
    getCurrentWindow().hide();
  };

  const handleImageLoad = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (canvas && img && img.complete && img.naturalWidth > 0) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      setImageLoaded(true);
    }
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const updateCursor = (pos: { x: number; y: number }) => {
    if (currentTool !== "select") {
      setCursorStyle("crosshair");
      return;
    }

    if (cropArea) {
      const resizeHandle = getResizeHandle(pos);
      if (resizeHandle) {
        const cursorMap = {
          nw: "nw-resize",
          ne: "ne-resize",
          sw: "sw-resize",
          se: "se-resize",
        };
        setCursorStyle(cursorMap[resizeHandle as keyof typeof cursorMap]);
        setHoverHandle(resizeHandle);
        return;
      } else if (isInsideCropArea(pos)) {
        setCursorStyle("move");
        setIsHoveringCrop(true);
        return;
      }
    }

    setCursorStyle("crosshair");
    setHoverHandle(null);
    setIsHoveringCrop(false);
  };

  const drawOnCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded || !currentScreenshot) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw all elements from current screenshot
    currentElements.forEach((element) => {
      ctx.strokeStyle = element.color;
      ctx.lineWidth = element.strokeWidth;
      ctx.fillStyle = element.color;

      switch (element.type) {
        case "rectangle":
          if (element.width && element.height) {
            ctx.strokeRect(element.x, element.y, element.width, element.height);
          }
          break;
        case "text":
          if (element.text) {
            ctx.font = "16px Arial";
            ctx.fillText(element.text, element.x, element.y);
          }
          break;
        case "pencil":
          if (element.points && element.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(element.points[0].x, element.points[0].y);
            element.points.forEach((point) => {
              ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
          }
          break;
        case "arrow":
          if (element.endX !== undefined && element.endY !== undefined) {
            // Draw arrow line
            ctx.beginPath();
            ctx.moveTo(element.x, element.y);
            ctx.lineTo(element.endX, element.endY);
            ctx.stroke();

            // Draw arrowhead
            const angle = Math.atan2(
              element.endY - element.y,
              element.endX - element.x
            );
            const headLength = 15;
            ctx.beginPath();
            ctx.moveTo(element.endX, element.endY);
            ctx.lineTo(
              element.endX - headLength * Math.cos(angle - Math.PI / 6),
              element.endY - headLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(element.endX, element.endY);
            ctx.lineTo(
              element.endX - headLength * Math.cos(angle + Math.PI / 6),
              element.endY - headLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
          }
          break;
      }
    });

    // Draw current element being created
    if (currentElement) {
      ctx.strokeStyle = currentElement.color;
      ctx.lineWidth = currentElement.strokeWidth;
      ctx.fillStyle = currentElement.color;

      switch (currentElement.type) {
        case "rectangle":
          if (currentElement.width && currentElement.height) {
            ctx.strokeRect(
              currentElement.x,
              currentElement.y,
              currentElement.width,
              currentElement.height
            );
          }
          break;
        case "pencil":
          if (currentElement.points && currentElement.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(currentElement.points[0].x, currentElement.points[0].y);
            currentElement.points.forEach((point) => {
              ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
          }
          break;
        case "arrow":
          if (
            currentElement.endX !== undefined &&
            currentElement.endY !== undefined
          ) {
            // Draw arrow line
            ctx.beginPath();
            ctx.moveTo(currentElement.x, currentElement.y);
            ctx.lineTo(currentElement.endX, currentElement.endY);
            ctx.stroke();

            // Draw arrowhead
            const angle = Math.atan2(
              currentElement.endY - currentElement.y,
              currentElement.endX - currentElement.x
            );
            const headLength = 15;
            ctx.beginPath();
            ctx.moveTo(currentElement.endX, currentElement.endY);
            ctx.lineTo(
              currentElement.endX - headLength * Math.cos(angle - Math.PI / 6),
              currentElement.endY - headLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(currentElement.endX, currentElement.endY);
            ctx.lineTo(
              currentElement.endX - headLength * Math.cos(angle + Math.PI / 6),
              currentElement.endY - headLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
          }
          break;
      }
    }

    // Draw crop area with handles
    if (cropArea) {
      // Semi-transparent overlay outside crop area
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Clear the crop area (make it fully visible)
      ctx.clearRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

      // Redraw image in crop area
      ctx.drawImage(
        img,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height
      );

      // Redraw elements in crop area
      currentElements.forEach((element) => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
        ctx.clip();

        ctx.strokeStyle = element.color;
        ctx.lineWidth = element.strokeWidth;
        ctx.fillStyle = element.color;

        switch (element.type) {
          case "rectangle":
            if (element.width && element.height) {
              ctx.strokeRect(
                element.x,
                element.y,
                element.width,
                element.height
              );
            }
            break;
          case "text":
            if (element.text) {
              ctx.font = "16px Arial";
              ctx.fillText(element.text, element.x, element.y);
            }
            break;
          case "pencil":
            if (element.points && element.points.length > 1) {
              ctx.beginPath();
              ctx.moveTo(element.points[0].x, element.points[0].y);
              element.points.forEach((point) => {
                ctx.lineTo(point.x, point.y);
              });
              ctx.stroke();
            }
            break;
          case "arrow":
            if (element.endX !== undefined && element.endY !== undefined) {
              // Draw arrow line
              ctx.beginPath();
              ctx.moveTo(element.x, element.y);
              ctx.lineTo(element.endX, element.endY);
              ctx.stroke();

              // Draw arrowhead
              const angle = Math.atan2(
                element.endY - element.y,
                element.endX - element.x
              );
              const headLength = 15;
              ctx.beginPath();
              ctx.moveTo(element.endX, element.endY);
              ctx.lineTo(
                element.endX - headLength * Math.cos(angle - Math.PI / 6),
                element.endY - headLength * Math.sin(angle - Math.PI / 6)
              );
              ctx.moveTo(element.endX, element.endY);
              ctx.lineTo(
                element.endX - headLength * Math.cos(angle + Math.PI / 6),
                element.endY - headLength * Math.sin(angle + Math.PI / 6)
              );
              ctx.stroke();
            }
            break;
        }
        ctx.restore();
      });

      // Draw crop border
      ctx.strokeStyle = "#0066cc";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
      ctx.setLineDash([]);

      // Draw resize handles
      const handleSize = 8;
      const handles = [
        {
          x: cropArea.x - handleSize / 2,
          y: cropArea.y - handleSize / 2,
          cursor: "nw-resize",
        },
        {
          x: cropArea.x + cropArea.width - handleSize / 2,
          y: cropArea.y - handleSize / 2,
          cursor: "ne-resize",
        },
        {
          x: cropArea.x - handleSize / 2,
          y: cropArea.y + cropArea.height - handleSize / 2,
          cursor: "sw-resize",
        },
        {
          x: cropArea.x + cropArea.width - handleSize / 2,
          y: cropArea.y + cropArea.height - handleSize / 2,
          cursor: "se-resize",
        },
      ];

      ctx.fillStyle = "#0066cc";
      handles.forEach((handle) => {
        ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      });

      // Calculate crop controls position (convert canvas coordinates to screen coordinates)
      const rect = canvas.getBoundingClientRect();
      const scaleX = rect.width / canvas.width;
      const scaleY = rect.height / canvas.height;

      setCropControlsPosition({
        x: rect.left + (cropArea.x + cropArea.width / 2) * scaleX,
        y: rect.top + (cropArea.y + cropArea.height) * scaleY + 10,
      });
    } else {
      setCropControlsPosition(null);
    }
  }, [
    currentElements,
    currentElement,
    cropArea,
    imageLoaded,
    currentScreenshot,
  ]);

  useEffect(() => {
    drawOnCanvas();
  }, [drawOnCanvas]);

  const getResizeHandle = (pos: { x: number; y: number }) => {
    if (!cropArea) return null;

    const handleSize = 8;
    const handles = [
      {
        type: "nw",
        x: cropArea.x - handleSize / 2,
        y: cropArea.y - handleSize / 2,
      },
      {
        type: "ne",
        x: cropArea.x + cropArea.width - handleSize / 2,
        y: cropArea.y - handleSize / 2,
      },
      {
        type: "sw",
        x: cropArea.x - handleSize / 2,
        y: cropArea.y + cropArea.height - handleSize / 2,
      },
      {
        type: "se",
        x: cropArea.x + cropArea.width - handleSize / 2,
        y: cropArea.y + cropArea.height - handleSize / 2,
      },
    ];

    for (const handle of handles) {
      if (
        pos.x >= handle.x &&
        pos.x <= handle.x + handleSize &&
        pos.y >= handle.y &&
        pos.y <= handle.y + handleSize
      ) {
        return handle.type;
      }
    }
    return null;
  };

  const isInsideCropArea = (pos: { x: number; y: number }) => {
    if (!cropArea) return false;
    return (
      pos.x >= cropArea.x &&
      pos.x <= cropArea.x + cropArea.width &&
      pos.y >= cropArea.y &&
      pos.y <= cropArea.y + cropArea.height
    );
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    updateCursor(pos);

    if (isDrawing) {
      handleMouseMove(e);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    setStartPos(pos);
    setIsDrawing(true);
    setDragStarted(false);

    if (currentTool === "text") {
      setTextPosition(pos);
      setShowTextInput(true);
      return;
    }

    if (currentTool === "select") {
      if (cropArea) {
        const resizeHandle = getResizeHandle(pos);
        if (resizeHandle) {
          setIsResizingCrop(resizeHandle);
          return;
        } else if (isInsideCropArea(pos)) {
          setIsDraggingCrop(true);
          return;
        } else {
          return;
        }
      }
      return;
    }

    if (currentTool === "arrow") {
      const newElement: DrawingElement = {
        type: "arrow",
        x: pos.x,
        y: pos.y,
        endX: pos.x,
        endY: pos.y,
        color: currentColor,
        strokeWidth: strokeWidth,
      };
      setCurrentElement(newElement);
      return;
    }

    const newElement: DrawingElement = {
      type: currentTool as "rectangle" | "pencil",
      x: pos.x,
      y: pos.y,
      color: currentColor,
      strokeWidth: strokeWidth,
      ...(currentTool === "pencil" && { points: [pos] }),
    };

    setCurrentElement(newElement);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const pos = getMousePos(e);

    if (currentTool === "select" && !cropArea && !dragStarted) {
      const dragDistance = Math.sqrt(
        Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2)
      );

      if (dragDistance > MIN_DRAG_DISTANCE) {
        setDragStarted(true);
        setCropArea({ x: startPos.x, y: startPos.y, width: 0, height: 0 });
      }
      return;
    }

    if (currentTool === "select" && cropArea) {
      if (isResizingCrop) {
        const newCrop = { ...cropArea };

        switch (isResizingCrop) {
          case "nw":
            newCrop.width += newCrop.x - pos.x;
            newCrop.height += newCrop.y - pos.y;
            newCrop.x = pos.x;
            newCrop.y = pos.y;
            break;
          case "ne":
            newCrop.width = pos.x - newCrop.x;
            newCrop.height += newCrop.y - pos.y;
            newCrop.y = pos.y;
            break;
          case "sw":
            newCrop.width += newCrop.x - pos.x;
            newCrop.height = pos.y - newCrop.y;
            newCrop.x = pos.x;
            break;
          case "se":
            newCrop.width = pos.x - newCrop.x;
            newCrop.height = pos.y - newCrop.y;
            break;
        }

        if (newCrop.width > 10 && newCrop.height > 10) {
          setCropArea(newCrop);
        }
        return;
      } else if (isDraggingCrop) {
        const deltaX = pos.x - startPos.x;
        const deltaY = pos.y - startPos.y;
        setCropArea({
          ...cropArea,
          x: cropArea.x + deltaX,
          y: cropArea.y + deltaY,
        });
        setStartPos(pos);
        return;
      } else if (dragStarted) {
        const newCrop = {
          x: Math.min(startPos.x, pos.x),
          y: Math.min(startPos.y, pos.y),
          width: Math.abs(pos.x - startPos.x),
          height: Math.abs(pos.y - startPos.y),
        };
        setCropArea(newCrop);
        setCropDimensions(
          `${Math.round(newCrop.width)} × ${Math.round(newCrop.height)}`
        );
        return;
      }
    }

    if (currentElement) {
      if (currentTool === "rectangle") {
        setCurrentElement({
          ...currentElement,
          width: pos.x - startPos.x,
          height: pos.y - startPos.y,
        });
      } else if (currentTool === "pencil") {
        setCurrentElement({
          ...currentElement,
          points: [...(currentElement.points || []), pos],
        });
      } else if (currentTool === "arrow") {
        setCurrentElement({
          ...currentElement,
          endX: pos.x,
          endY: pos.y,
        });
      }
    }
  };

  const handleMouseUp = () => {
    if (currentElement && currentTool !== "select") {
      const newState: ScreenshotData = {
        image: currentScreenshot.image,
        elements: [...currentElements, currentElement],
      };
      addNewState(newState);
      setCurrentElement(null);
    }
    setIsDrawing(false);
    setIsDraggingCrop(false);
    setIsResizingCrop(null);
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      const textElement: DrawingElement = {
        type: "text",
        x: textPosition.x,
        y: textPosition.y,
        text: textInput,
        color: currentColor,
        strokeWidth: strokeWidth,
      };

      const newState: ScreenshotData = {
        image: currentScreenshot.image,
        elements: [...currentElements, textElement],
      };
      addNewState(newState);
    }
    setTextInput("");
    setShowTextInput(false);
  };

  useEffect(() => {
    const unlisten = listen("screenshot_taken", (event) => {
      const newScreenshot: ScreenshotData = {
        image: event.payload as string,
        elements: [],
      };
      setScreenshotData([newScreenshot]);
      setCurrentScreenshotIndex(0);
      setImageLoaded(false); // Reset image loaded when new screenshot comes in
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (cropArea) {
          setCropArea(null);
        } else {
          getCurrentWindow().hide();
        }
        return;
      }

      // Tool shortcuts
      if (!showTextInput) {
        switch (event.key.toLowerCase()) {
          case "s":
            setCurrentTool("select");
            break;
          case "r":
            setCurrentTool("rectangle");
            break;
          case "t":
            setCurrentTool("text");
            break;
          case "p":
            setCurrentTool("pencil");
            break;
          case "a":
            setCurrentTool("arrow");
            break;
          case "z":
            if (event.ctrlKey || event.metaKey) {
              event.preventDefault();
              if (event.shiftKey) {
                handleRedo();
              } else {
                handleUndo();
              }
            }
            break;
          case "y":
            if (event.ctrlKey || event.metaKey) {
              event.preventDefault();
              handleRedo();
            }
            break;
          case "enter":
            if (cropArea) {
              applyCrop();
              return;
            }
            handleSave();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cropArea, showTextInput]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.25));
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
  };
  return (
    <div className="h-screen w-screen bg-background flex flex-col">
      {/* Floating Bottom Toolbar */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Toggle
              pressed={currentTool === "select"}
              onPressedChange={() => setCurrentTool("select")}
              size="sm"
              className="relative"
              onMouseEnter={() => setShowTooltip("select")}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <Crop className="h-4 w-4" />
              {showTooltip === "select" && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap border shadow-md">
                  Select & Crop (S)
                </div>
              )}
            </Toggle>
            <Toggle
              pressed={currentTool === "rectangle"}
              onPressedChange={() => setCurrentTool("rectangle")}
              size="sm"
              className="relative"
              onMouseEnter={() => setShowTooltip("rectangle")}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <Square className="h-4 w-4" />
              {showTooltip === "rectangle" && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap border shadow-md">
                  Rectangle (R)
                </div>
              )}
            </Toggle>
            <Toggle
              pressed={currentTool === "text"}
              onPressedChange={() => setCurrentTool("text")}
              size="sm"
              className="relative"
              onMouseEnter={() => setShowTooltip("text")}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <Type className="h-4 w-4" />
              {showTooltip === "text" && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap border shadow-md">
                  Add Text (T)
                </div>
              )}
            </Toggle>
            <Toggle
              pressed={currentTool === "pencil"}
              onPressedChange={() => setCurrentTool("pencil")}
              size="sm"
              className="relative"
              onMouseEnter={() => setShowTooltip("pencil")}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <Pencil className="h-4 w-4" />
              {showTooltip === "pencil" && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap border shadow-md">
                  Free Draw (P)
                </div>
              )}
            </Toggle>
            <Toggle
              pressed={currentTool === "arrow"}
              onPressedChange={() => setCurrentTool("arrow")}
              size="sm"
              className="relative"
              onMouseEnter={() => setShowTooltip("arrow")}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <ArrowUpRight className="h-4 w-4" />
              {showTooltip === "arrow" && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap border shadow-md">
                  Draw Arrow (A)
                </div>
              )}
            </Toggle>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Color Palette */}
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-gray-400" />
            <div className="flex gap-1">
              {colorPresets.map((color) => (
                <button
                  key={color}
                  onClick={() => setCurrentColor(color)}
                  className={`w-6 h-6 rounded border-2 cursor-pointer transition-all ${
                    currentColor === color
                      ? "border-primary scale-110"
                      : "border-gray-300 hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <input
              type="color"
              value={currentColor}
              onChange={(e) => setCurrentColor(e.target.value)}
              className="w-6 h-6 rounded border-0 cursor-pointer ml-1"
            />
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Width:</span>
            <Input
              type="number"
              min="1"
              max="10"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-16 h-8"
            />
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.25}
              className="bg-transparent"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-400 min-w-12 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
              className="bg-transparent"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomReset}
              className="bg-transparent text-xs px-2"
            >
              Reset
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={handleUndo}
              disabled={!canUndo}
              className="relative bg-transparent"
              onMouseEnter={() => setShowTooltip("undo")}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <Undo className="h-4 w-4" />
              {showTooltip === "undo" && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap border shadow-md">
                  Undo (Ctrl+Z)
                </div>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRedo}
              disabled={!canRedo}
              className="relative bg-transparent"
              onMouseEnter={() => setShowTooltip("redo")}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <Redo className="h-4 w-4" />
              {showTooltip === "redo" && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap border shadow-md">
                  Redo (Ctrl+Y)
                </div>
              )}
            </Button>
          </div>

          <Separator
            orientation="vertical"
            className="h-6"
            onMouseEnter={() => setShowTooltip("save")}
            onMouseLeave={() => setShowTooltip(null)}
          />

          <Button
            size="sm"
            onClick={handleSave}
            className="relative"
            onMouseEnter={() => setShowTooltip("save")}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <Download className="h-4 w-4 mr-1" />
            Save
            {showTooltip === "save" && (
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap border shadow-md">
                Save (Enter)
              </div>
            )}
          </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto bg-background/50 relative flex justify-center items-center pb-20">
        {currentScreenshot && (
          <>
            <img
              key={currentScreenshot.image} // Use just the image URL as key
              ref={imageRef}
              src={currentScreenshot.image || "/placeholder.svg"}
              alt="Screenshot"
              onLoad={handleImageLoad}
              onError={() => setImageLoaded(false)}
              className="hidden"
            />
            {!imageLoaded && currentScreenshot && (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <div className="text-lg mb-2">Loading image...</div>
                </div>
              </div>
            )}
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleMouseUp}
              style={{
                display: imageLoaded ? "block" : "none",
                margin: "auto",
                maxWidth: "100%",
                maxHeight: "100%",
                width: "auto",
                height: "auto",
                cursor: cursorStyle,
                transform: `scale(${zoomLevel})`,
                transformOrigin: "center",
              }}
            />
          </>
        )}

        {!currentScreenshot && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-lg mb-2">Waiting for screenshot...</div>
              <div className="text-sm">Take a screenshot to start editing</div>
            </div>
          </div>
        )}

        {/* Text Input Modal */}
        {showTextInput && (
          <div className="absolute inset-0 bg-background bg-opacity-50 flex items-center justify-center">
            <div className="bg-background/50 p-4 rounded-lg">
              <Input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter text..."
                className="mb-2"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleTextSubmit();
                  } else if (e.key === "Escape") {
                    setShowTextInput(false);
                    setTextInput("");
                  }
                }}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleTextSubmit}>
                  Add Text
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowTextInput(false);
                    setTextInput("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Crop Dimensions Display */}
      {cropArea && cropDimensions && (
        <div
          className="absolute z-20 bg-background/95 backdrop-blur-sm border rounded px-2 py-1 text-xs"
          style={{
            left: cropControlsPosition?.x || 0,
            top: (cropControlsPosition?.y || 0) - 30,
            transform: "translateX(-50%)",
          }}
        >
          {cropDimensions}
        </div>
      )}
      {/* Crop Controls */}
      {cropArea && cropControlsPosition && (
        <div
          className="absolute z-20 flex gap-2"
          style={{
            left: cropControlsPosition.x,
            top: cropControlsPosition.y,
            transform: "translateX(-50%)",
          }}
        >
          <Button
            size="sm"
            variant="outline"
            onClick={cancelCrop}
            className="bg-background/95 text-destructive backdrop-blur-sm border shadow-lg hover:bg-destructive hover:text-destructive-foreground"
            onMouseEnter={() => setShowTooltip("cancel-crop")}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <X className="h-4 w-4" />
            {showTooltip === "cancel-crop" && (
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap border shadow-md">
                Cancel (Escape)
              </div>
            )}
          </Button>
          <Button
            size="sm"
            onClick={applyCrop}
            onMouseEnter={() => setShowTooltip("apply-crop")}
            onMouseLeave={() => setShowTooltip(null)}
            className="bg-background/95 text-primary backdrop-blur-sm border shadow-lg hover:bg-primary hover:text-primary-foreground"
          >
            <Check className="h-4 w-4" />
            {showTooltip === "apply-crop" && (
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap border shadow-md">
                Apply (Enter)
              </div>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export default Screenshot;
