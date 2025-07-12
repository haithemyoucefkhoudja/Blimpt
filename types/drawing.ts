export type Tool = "select" | "rectangle" | "text" | "pencil" | "arrow";

export interface DrawingElement {
  type: "rectangle" | "text" | "pencil" | "arrow";
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  color: string;
  strokeWidth: number;
  points?: { x: number; y: number }[];
  endX?: number;
  endY?: number;
}
export interface ScreenshotData {
  image: string;
  elements: DrawingElement[];
}
export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}
