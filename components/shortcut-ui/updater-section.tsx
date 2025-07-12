"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, Download, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MarkdownMessage } from "../ui/react-markdown";
import { useQuery } from "@tanstack/react-query";

interface UpdateInfo {
  version: string;
  date: string;
  body: string;
}

const checkForUpdates = async (): Promise<UpdateInfo | null> => {
  try {
    const { check } = await import("@tauri-apps/plugin-updater");
    const update = await check();
    if (update) {
      return {
        version: update.version,
        date: update.date,
        body: update.body,
      };
    }
    return null;
  } catch (err) {
    console.error("Error checking for updates:", err);
    throw new Error("Failed to check for updates. Please try again later.");
  }
};

const UpdaterSection = () => {
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    data: updateAvailable,
    error: queryError,
    isLoading: checking,
    refetch,
  } = useQuery<UpdateInfo | null>({
    queryKey: ["updater"],
    queryFn: checkForUpdates,
    refetchInterval: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const downloadAndInstallUpdate = async () => {
    if (!updateAvailable) return;

    setDownloading(true);
    setDownloadProgress(0);
    setError(null);

    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const { relaunch } = await import("@tauri-apps/plugin-process");

      const update = await check();
      if (!update) {
        setError("Update is no longer available");
        setDownloading(false);
        return;
      }

      let downloaded = 0;
      let contentLength = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength;
            console.log(`Started downloading ${contentLength} bytes`);
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            const progress = Math.round((downloaded / contentLength) * 100);
            setDownloadProgress(progress);
            console.log(`Downloaded ${downloaded} from ${contentLength}`);
            break;
          case "Finished":
            console.log("Download finished");
            setDownloadComplete(true);
            break;
        }
      });

      console.log("Update installed");
      await relaunch();
    } catch (err) {
      console.error("Error installing update:", err);
      setError("Failed to install update. Please try again later.");
      setDownloading(false);
    }
  };

  return (
    <Card className="w-full mt-6 border-0 bg-background shadow-none">
      <CardHeader>
        <CardTitle>Software Updates</CardTitle>
        <CardDescription>
          Check for and install application updates
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(error || queryError) && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error || (queryError as Error)?.message}
            </AlertDescription>
          </Alert>
        )}

        {updateAvailable ? (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Update Available</AlertTitle>
              <AlertDescription>
                Version {updateAvailable.version} is available (released on{" "}
                {new Date(updateAvailable.date).toLocaleDateString()})
              </AlertDescription>
            </Alert>

            {updateAvailable.body && (
              <div className="text-sm">
                <h4 className="font-medium mb-1">Release Notes:</h4>
                <MarkdownMessage
                  content={updateAvailable.body}
                ></MarkdownMessage>
              </div>
            )}

            {downloading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Downloading update...</span>
                  <span>{downloadProgress}%</span>
                </div>
                <Progress value={downloadProgress} className="w-full" />
              </div>
            )}

            {downloadComplete && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle className="text-green-700">
                  Download Complete
                </AlertTitle>
                <AlertDescription className="text-green-600">
                  Update has been downloaded and will be installed when you
                  restart the application.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="text-left ">
            <p className="text-muted-foreground mb-4">
              {checking
                ? "Checking for updates..."
                : "Your application is up to date."}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 items-start">
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={checking || downloading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${checking ? "animate-spin" : ""}`}
          />
          Check for Updates
        </Button>

        {updateAvailable && !downloadComplete && (
          <Button
            className=""
            onClick={downloadAndInstallUpdate}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download & Install
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default UpdaterSection;
