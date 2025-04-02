import React, { useEffect, useState} from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import ModelsList from "./models-list";
import ProvidersList from "./providers-list";
import { useConfig } from "@/providers/config-provider";
import { useAppResize } from "./hooks/use-app-resize";
import UpdaterSection from "./updater-section";


const WINDOW = "settings"
const ConfigManager: React.FC = () => {
  const { config, saveConfig, updateConfig, isUpdated } = useConfig();
  const [saveMessage, setSaveMessage] = useState("");
  const { setActiveWindow } = useAppResize()

  // Set the active window once on component mount
  useEffect(() => {
    
    setActiveWindow(WINDOW);
  },[setActiveWindow])


  const saveConfigInner = async () => {
    saveConfig();
    setSaveMessage("Configuration saved successfully");
    setTimeout(() => setSaveMessage(""), 3000);
  };


  return (
    <div data-tauri-drag-region className="w-full max-h-96 overflow-hidden px-2">
      <ScrollArea data-tauri-drag-region className="h-full">
        <Card data-tauri-drag-region className="w-full border-0 bg-background shadow-none">
          <CardHeader data-tauri-drag-region>
            <CardTitle>Configuration Manager</CardTitle>
            <CardDescription>Manage your application settings</CardDescription>
          </CardHeader>
          <CardContent data-tauri-drag-region>
            
                <ProvidersList providers={config.providers} updateProviders={(providers) => {
                  updateConfig("providers", providers);
                }} />
                <ModelsList models={config.models} providers={config.providers} updateModels={(models) => {updateConfig("models", models)}}/>
              
              {/* <TabsContent data-tauri-drag-region value="general">
                <div data-tauri-drag-region className="space-y-4">
                    <div data-tauri-drag-region className="grid w-full items-center gap-1.5">
                        <Label htmlFor="keep-alive">Keep Alive</Label>
                        <Input
                        type="text"
                        id="keep-alive"
                        value={config.GENERAL.KEEP_ALIVE}
                        onChange={(e) => updateConfig("GENERAL", {...config.GENERAL, KEEP_ALIVE: e.target.value})}
                        />
                    </div>
                </div>
                </TabsContent>    */}
              {/* <TabsContent data-tauri-drag-region value="api-endpoints">
                <div data-tauri-drag-region className="space-y-4">
                  {Object.entries(config.API_ENDPOINTS).map(([key, value]) => {
                    if(key === "OLLAMA") return null;
                    return (
                      <div data-tauri-drag-region key={key} className="grid w-full items-center gap-1.5">
                        <Label htmlFor={key.toLowerCase()}>{key}</Label>
                        <Input
                          type="text"
                          id={key.toLowerCase()}
                          value={value}
                          onChange={(e) =>
                            updateConfig("API_ENDPOINTS", { ...config.API_ENDPOINTS, [key]: e.target.value })
                          }
                        />
                      </div>
                    )
                  })}
                </div>
              </TabsContent> */}
            
          </CardContent>
          <CardFooter data-tauri-drag-region  className="flex flex-col items-start gap-2">
            {saveMessage && (
              <p className="text-sm text-green-500">{saveMessage}</p>
            )}
            <Button disabled={!isUpdated} onClick={saveConfigInner}>Save Configuration</Button>
          </CardFooter>
        </Card>
        {/* Added Updater Section */}
        <UpdaterSection />
      </ScrollArea>
    </div>
  );
};

export default ConfigManager;
