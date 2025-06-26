"use client";

import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ListScrollArea } from "@/components/ui/list-scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Circle,
  AlertCircle,
  ExternalLink,
  RefreshCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useAppResize,
  useSizeChange,
} from "@/components/shortcut-ui/hooks/use-app-resize";
import OnlineStatusIndicator from "@/components/ui/on-indicator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CHECKSEARXNG_TIMOUT } from "@/utils/constants";
import { useConfig } from "@/providers/config-provider";
import { ScrollArea } from "@/components/ui/scroll-area";

type Status = "idle" | "checking" | "installing" | "port" | "error" | "done";
type Step =
  | "check_docker"
  | "start_docker"
  | "wait_docker"
  | "check_searxng"
  | "pull_searxng"
  | "run_searxng"
  | "done_searxng";

function DockerRequirementsLink() {
  return (
    <Alert className="mb-4">
      <AlertCircle className="h-4 w-4" color="red" />
      <AlertDescription className="flex justify-between space-y-2 flex-col">
        <span className="text-sm text-slate-700">
          Important! Please check the system requirements before installing
          Docker.
        </span>
        <a
          href="https://docs.docker.com/desktop/setup/install/windows-install/#system-requirements"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          View Requirements
          <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      </AlertDescription>
    </Alert>
  );
}
const DOCKER_TIMOUT = 60;
export function CommandControl() {
  const { setActiveWindow } = useAppResize();

  const [dockerInstalled, setDockerInstalled] = useState<boolean | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [currentStep, setCurrentStep] = useState<Step>("check_docker");
  const currentStepRef = useRef<Step>("check_docker");
  const [message, setMessage] = useState("Docker TimedOut");
  const { port, setPort } = useConfig();
  const [dockerStartTimeout, setDockerStartTimeout] = useState(DOCKER_TIMOUT);

  useSizeChange(() => {}, [message]);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);
  useEffect(() => {
    if (dockerStartTimeout <= 0) {
      setDockerStartTimeout(DOCKER_TIMOUT);
      setStatus("error");
      setMessage("Docker TimedOut");
    }
  }, [dockerStartTimeout]);

  useEffect(() => {
    const checkSearxngState = () => {
      invoke<string>("get_searxng_state")
        .then((port) => {
          if (
            currentStepRef.current == "start_docker" ||
            currentStepRef.current == "wait_docker"
          )
            return;
          if (!port) {
            setStatus("idle");
            setCurrentStep("check_docker");
            setMessage("");
          } else {
            setPort(port);
            setStatus("done");
            setMessage("SearXNG is running on port: " + port);
            setCurrentStep("done_searxng");
          }
        })
        .catch(console.error);
    };

    // Initial check
    checkSearxngState();
    // Set up interval for periodic checks
    const timer = setInterval(checkSearxngState, CHECKSEARXNG_TIMOUT);
    const listeners = [
      {
        event: "docker-check",
        handler: (event: any) => {
          setDockerInstalled(event.payload as boolean);
          setCurrentStep(event.payload ? "start_docker" : "check_docker");
        },
      },
      {
        event: "docker-run",
        handler: (event: any) => {
          setCurrentStep("wait_docker");
          setMessage(event.payload as string);
        },
      },
      {
        event: "searxng-check",
        handler: (event: any) => {
          setCurrentStep("check_searxng");
          setMessage(event.payload as string);
        },
      },
      {
        event: "searxng-run",
        handler: (event: any) => {
          setCurrentStep("run_searxng");
          setStatus("port");
          setMessage(event.payload as string);
        },
      },
      {
        event: "searxng-done",
        handler: (event: any) => {
          setCurrentStep("done_searxng");
          setStatus("done");
          setMessage(
            ("SearXNG is running on port: " + event.payload) as string
          );
          setPort(event.payload as string);
        },
      },
      {
        event: "error",
        handler: (event: any) => {
          setStatus("error");
          setMessage(event.payload as string);
        },
      },
    ];

    const unlisteners = listeners.map(({ event, handler }) =>
      listen(event, handler)
    );

    return () => {
      unlisteners.forEach((unlistener) => unlistener.then((f) => f()));
      if (timer) clearInterval(timer);
    };
  }, []);

  // Update Docker timeout counter
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentStep === "wait_docker" && dockerStartTimeout > 0) {
      timer = setInterval(() => {
        setDockerStartTimeout((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentStep, dockerStartTimeout]);

  const handleStart = async () => {
    setStatus("checking");
    try {
      await invoke("start_setup");
    } catch (error) {
      setStatus("error");
      setMessage(error as string);
    }
  };

  const steps = [
    { key: "check_docker", title: "Check Docker Installation" },
    { key: "start_docker", title: "Start Docker Desktop" },
    { key: "wait_docker", title: "Wait for Docker Engine" },
    { key: "check_searxng", title: "Check SearXNG Image" },
    { key: "pull_searxng", title: "Pull SearXNG Image" },
    { key: "run_searxng", title: "Run SearXNG Container" },
    { key: "done_searxng", title: "" },
  ];

  const getStepIcon = (stepKey: Step) => {
    if (stepKey === "done_searxng") {
      return null;
    }
    if (
      steps.findIndex((s) => s.key === stepKey) <
      steps.findIndex((s) => s.key === currentStep)
    ) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (stepKey === currentStep) {
      if (status === "error") {
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      }
      return <Circle className="w-5 h-5 text-blue-500 animate-pulse" />;
    }
    return <Circle className="w-5 h-5 text-gray-300" />;
  };

  const getStepDescription = (stepKey: Step) => {
    if (stepKey === "wait_docker" && currentStep === "wait_docker") {
      return (
        <span className="text-xs text-muted-foreground">
          Timeout in {dockerStartTimeout}s
        </span>
      );
    }
    if (stepKey === "done_searxng" && status === "done") {
      return (
        <a
          href={`http://localhost:${port}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-blue-500 hover:text-blue-700 flex items-center"
        >
          Open SearXNG <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      );
    }
    return null;
  };

  return (
    <Card
      data-tauri-drag-region
      className="w-full h mx-2 bg-background border-none shadow-none h-full flex flex-col justify-center overflow-hidden max-h-48 rounded-none px-4"
    >
      <ScrollArea data-tauri-drag-region>
        <CardHeader data-tauri-drag-region>
          <CardTitle className="text-2xl font-bold text-primary">
            Docker & SearXNG Setup
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xl">
            Run SearXNG
          </CardDescription>
        </CardHeader>
        <CardContent data-tauri-drag-region>
          {dockerInstalled === false ? (
            <div
              data-tauri-drag-region
              className="flex flex-col items-center space-y-4"
            >
              <p className="text-sm text-red-500">
                Docker is not installed. Please install Docker to continue.
              </p>
              <Separator className="w-full" />
              <DockerRequirementsLink />
              <div data-tauri-drag-region className="flex space-x-2">
                <Button asChild>
                  <a
                    href="https://docs.docker.com/desktop/install/windows-install/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Install Docker
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center space-x-2"
                  onClick={() => {
                    setDockerInstalled(null);
                    setCurrentStep("check_docker");
                    setStatus("idle");
                  }}
                >
                  Try Again
                  <RefreshCcw className="w-6 h-6" />
                </Button>
              </div>
            </div>
          ) : status == "error" ? (
            <Alert className="mb-4 flex  items-center">
              <AlertCircle className="h-4 w-4" color="red" />
              <AlertDescription className="flex justify-between space-y-2 flex-col items-center">
                <span className="text-sm text-red-500">{message}</span>
              </AlertDescription>
            </Alert>
          ) : (
            <div data-tauri-drag-region className="space-y-2">
              {steps.map((step, index) => (
                <div
                  data-tauri-drag-region
                  key={step.key}
                  className="flex flex-col space-y-1"
                >
                  <div
                    data-tauri-drag-region
                    className="flex items-center justify-between"
                  >
                    <div
                      data-tauri-drag-region
                      className="flex items-center space-x-2"
                    >
                      {getStepIcon(step.key as Step)}
                      <span
                        className={cn(
                          "text-sm",
                          currentStep === step.key
                            ? "font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        {step.title}
                      </span>
                    </div>
                    {getStepDescription(step.key as Step)}
                  </div>
                  {index < steps.length - 2 && <Separator className="w-full" />}
                </div>
              ))}
              {message && (
                <p className="text-sm text-muted-foreground mt-2 italic">
                  {message}
                </p>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter data-tauri-drag-region>
          {dockerInstalled !== false && (
            <Button
              onClick={handleStart}
              disabled={status !== "idle" && status !== "error"}
              className="w-full space-x-2 flex items-center justify-center"
            >
              {status !== "done" && (
                <>
                  <span>
                    {status === "idle"
                      ? "Start Setup"
                      : status === "error"
                      ? "Try Again"
                      : "Setting up..."}
                  </span>
                  {status == "error" && <RefreshCcw className="w-6 h-6" />}
                </>
              )}
              {status === "done" && <OnlineStatusIndicator isOnline />}
            </Button>
          )}
        </CardFooter>
      </ScrollArea>
    </Card>
  );
}
