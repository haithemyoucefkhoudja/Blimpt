"use client";

import type React from "react";
import { useState } from "react";
import {
  PlusCircle,
  Check,
  X,
  Edit,
  TrashIcon,
  EyeOff,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Provider, CustomProvider } from "@/types/settings/provider";
const isCustomProvider = (provider: Provider): provider is CustomProvider => {
  return "baseUrl" in provider;
};

interface ProvidersListProps {
  providers: Provider[] | null;
  updateProviders: (providers: Provider[]) => void;
}
const ProvidersList: React.FC<ProvidersListProps> = ({
  providers,
  updateProviders,
}) => {
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [newProvider, setNewProvider] = useState<CustomProvider>({
    name: "",
    baseUrl: "",
    apiKey: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const deleteProvider = async (name: string) => {
    if (!providers) return;
    const updatedProviders = providers.filter(
      (provider) => provider.name !== name
    );
    updateProviders(updatedProviders);
  };

  const handleEditProvider = (name: string) => {
    setEditingProvider(name);
  };

  const handleSaveProvider = async () => {
    setEditingProvider(null);
    // await saveConfig()
  };

  const handleProviderChange = (
    name: string,
    field: "apiKey" | "baseUrl",
    value: string
  ) => {
    if (!providers) return;
    updateProviders(
      providers.map((provider) =>
        provider.name === name
          ? isCustomProvider(provider)
            ? { ...provider, [field]: value }
            : { ...provider, apiKey: value }
          : provider
      )
    );
  };

  const handleAddProvider = async () => {
    if (!providers) return;

    if (newProvider.name && newProvider.baseUrl) {
      const updatedProviders = [...providers, newProvider];
      updateProviders(updatedProviders);
      setNewProvider({ name: "", baseUrl: "", apiKey: "" });
      // await saveConfig()
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Providers</h2>
      <ul className="space-y-4 mb-8">
        {providers &&
          providers.map((provider) => (
            <li
              key={provider.name}
              className="bg-background border rounded-lg p-4"
            >
              {editingProvider === provider.name ? (
                <div className="space-y-2">
                  <div className="space-x-2 flex">
                    <Input
                      value={provider.apiKey}
                      onChange={(e) =>
                        handleProviderChange(
                          provider.name,
                          "apiKey",
                          e.target.value
                        )
                      }
                      className="w-full"
                      type={!showPassword ? "password" : "text"}
                      placeholder="API Key"
                    />

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {!showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {isCustomProvider(provider) && (
                    <Input
                      value={provider.baseUrl}
                      onChange={(e) =>
                        handleProviderChange(
                          provider.name,
                          "baseUrl",
                          e.target.value
                        )
                      }
                      className="w-full"
                      placeholder="Base URL"
                    />
                  )}
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={handleSaveProvider}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingProvider(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <div>
                    <h3 className="font-semibold truncate max-w-[100px]">
                      {provider.name}
                    </h3>
                    {isCustomProvider(provider) && (
                      <p className="text-sm text-muted-foreground truncate max-w-[100px]">
                        {provider.baseUrl}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditProvider(provider.name)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {isCustomProvider(provider) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteProvider(provider.name)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
      </ul>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Add New Custom Provider</h3>
        <Input
          placeholder="Provider name"
          value={newProvider.name}
          onChange={(e) =>
            setNewProvider({ ...newProvider, name: e.target.value })
          }
        />
        <Input
          placeholder="Base API URL"
          value={newProvider.baseUrl}
          onChange={(e) =>
            setNewProvider({ ...newProvider, baseUrl: e.target.value })
          }
        />
        <Input
          placeholder="API Key"
          type="password"
          value={newProvider.apiKey}
          onChange={(e) =>
            setNewProvider({ ...newProvider, apiKey: e.target.value })
          }
        />
        <Button onClick={handleAddProvider} className="w-full">
          <PlusCircle className="w-4 h-4 mr-2" /> Add Custom Provider
        </Button>
      </div>
    </div>
  );
};

export default ProvidersList;
