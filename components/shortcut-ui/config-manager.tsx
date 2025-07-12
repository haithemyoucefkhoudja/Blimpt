import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import ModelsList from "./models-list";
import ProvidersList from "./providers-list";
import { useConfig } from "@/providers/config-provider";
import UpdaterSection from "./updater-section";
import { ListScrollArea } from "../ui/list-scroll-area";
import { invoke } from "@tauri-apps/api/core";
import { Shortcut } from "@/types/shortcut";
import { useShortcutEditor } from "@/hooks/use-shortcut-editor";
import { ShortcutItem } from "../shortcut-item";
import { Slider } from "../ui/slider";
import { Label } from "../ui/label";
const OutPutDelay = () => {
  const { config, updateConfig } = useConfig();
  const [value, setValue] = React.useState<number>(config.OUTPUT_DELAY);

  const handleValueChange = (value: number) => {
    setValue(value);
    updateConfig("OUTPUT_DELAY", value);
  };

  return (
    <div className="space-y-6 mb-4">
      <Label>Output Delay</Label>
      <Slider
        value={[value]}
        onValueChange={(value) => handleValueChange(value[0])}
        min={1}
        max={100}
      />
    </div>
  );
};
const ConfigManager: React.FC = () => {
  const { config, saveConfig, updateConfig, isUpdated } = useConfig();
  const [saveMessage, setSaveMessage] = useState("");
  const [mainShortcut, setMainShortcut] = useState<Shortcut>([]);
  const [screenshotShortcut, setScreenshotShortcut] = useState<Shortcut>([]);

  async function getCurrentShortcut(windowLabel: string) {
    try {
      const res: string = await invoke("get_current_shortcut", { windowLabel });
      if (windowLabel === "main") {
        setMainShortcut(res?.split("+"));
      } else {
        setScreenshotShortcut(res?.split("+"));
      }
    } catch (err) {
      console.error(`Failed to fetch shortcut for ${windowLabel}:`, err);
    }
  }

  useEffect(() => {
    getCurrentShortcut("main");
    getCurrentShortcut("screenshot");
  }, []);

  const changeShortcut = (key: Shortcut, windowLabel: string) => {
    if (windowLabel === "main") {
      setMainShortcut(key);
    } else {
      setScreenshotShortcut(key);
    }
    if (key.length === 0) return;
    invoke("change_shortcut", { key: key?.join("+"), windowLabel }).catch(
      (err) => {
        console.error(`Failed to save hotkey for ${windowLabel}:`, err);
      }
    );
  };

  const mainEditor = useShortcutEditor(mainShortcut, (key) =>
    changeShortcut(key, "main")
  );
  const screenshotEditor = useShortcutEditor(screenshotShortcut, (key) =>
    changeShortcut(key, "screenshot")
  );

  const onEditShortcut = async (windowLabel: string) => {
    if (windowLabel === "main") {
      mainEditor.startEditing();
    } else {
      screenshotEditor.startEditing();
    }
    invoke("unregister_shortcut", { windowLabel }).catch((err) => {
      console.error(`Failed to unregister hotkey for ${windowLabel}:`, err);
    });
  };

  const onCancelShortcut = async (windowLabel: string) => {
    if (windowLabel === "main") {
      mainEditor.cancelEditing();
      invoke("change_shortcut", {
        key: mainShortcut?.join("+"),
        windowLabel,
      }).catch((err) => {
        console.error(`Failed to save hotkey for ${windowLabel}:`, err);
      });
    } else {
      screenshotEditor.cancelEditing();
      invoke("change_shortcut", {
        key: screenshotShortcut?.join("+"),
        windowLabel,
      }).catch((err) => {
        console.error(`Failed to save hotkey for ${windowLabel}:`, err);
      });
    }
  };

  const onSaveShortcut = async (windowLabel: string) => {
    if (windowLabel === "main") {
      mainEditor.saveShortcut();
    } else {
      screenshotEditor.saveShortcut();
    }
  };

  const saveConfigInner = async () => {
    saveConfig();
    setSaveMessage("Configuration saved successfully");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  return (
    <div
      data-tauri-drag-region
      className="w-full max-h-96 overflow-hidden px-2"
    >
      <ListScrollArea data-tauri-drag-region className="h-full">
        <Card
          data-tauri-drag-region
          className="w-full border-0 bg-background shadow-none"
        >
          <CardHeader data-tauri-drag-region>
            <CardTitle>Configuration Manager</CardTitle>
            <CardDescription>Manage your application settings</CardDescription>
          </CardHeader>
          <CardContent data-tauri-drag-region>
            <ProvidersList
              providers={config.providers}
              updateProviders={(providers) => {
                updateConfig("providers", providers);
              }}
            />
            <ModelsList
              models={config.models}
              providers={config.providers}
              updateModels={(models) => {
                updateConfig("models", models);
              }}
            />
            <OutPutDelay />
            <div className="space-y-6">
              <ShortcutItem
                label="Main Window Shortcut"
                shortcut={mainShortcut}
                isEditing={mainEditor.isEditing}
                currentKeys={mainEditor.currentKeys}
                onEdit={() => onEditShortcut("main")}
                onSave={() => onSaveShortcut("main")}
                onCancel={() => onCancelShortcut("main")}
              />
              <ShortcutItem
                label="Screenshot Shortcut"
                shortcut={screenshotShortcut}
                isEditing={screenshotEditor.isEditing}
                currentKeys={screenshotEditor.currentKeys}
                onEdit={() => onEditShortcut("screenshot")}
                onSave={() => onSaveShortcut("screenshot")}
                onCancel={() => onCancelShortcut("screenshot")}
              />
            </div>
          </CardContent>
          <CardFooter
            data-tauri-drag-region
            className="flex flex-col items-start gap-2"
          >
            {saveMessage && (
              <p className="text-sm text-green-500">{saveMessage}</p>
            )}
            <Button disabled={!isUpdated} onClick={saveConfigInner}>
              Save Configuration
            </Button>
          </CardFooter>
        </Card>
        {/* Added Updater Section */}
        <UpdaterSection />
      </ListScrollArea>
    </div>
  );
};

export default ConfigManager;
