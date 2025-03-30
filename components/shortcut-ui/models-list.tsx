import React, { useState } from 'react';
import { PlusCircle, Settings, Check, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Model } from '@/types/settings/model';
import { Provider } from '@/types/settings/provider';
import ModelSelect from './model-select';
import { useConfig } from '@/providers/config-provider';
import { Label } from '../ui/label';


interface ModelsListProps { 
  providers: Provider[] | null;
  models: Model[] | null;
  updateModels: (models: Model[]) => void;
}
const ModelsList: React.FC<ModelsListProps> = ({providers, models, updateModels}) => {
  
  const [editingModel, setEditingModel] = useState<string | null>(null);
  const [newModel, setNewModel] = useState<Model>({ id: '', name: '', provider: providers && providers[0] ? providers[0].name : '', isDeepThinking: false });
  const { config, updateConfig } = useConfig();
  

  // const saveModels = async (updatedModels: Model[]) => {
  //   const store = await load("config.json", { autoSave: false });
  //   await store.set('models', updatedModels);
  //   await store.save();
  // };

  const handleEditClick = (id: string) => {
    setEditingModel(id);
  };

  const handleSaveEdit = async () => {
    setEditingModel(null);
  };

  const handleCancelEdit = () => {
    setEditingModel(null);
  };

  const handleModelChange = (id: string, field: keyof Model, value: string | boolean) => {
    if(!models) return;
    const updatedModels = models.map(model => 
      model.id === id ? { ...model, [field]: value } : model
    );
    updateModels(updatedModels);
  };

  const handleAddModel = async () => {
    if (!models || !providers) return;

    if (newModel.name) {
      const updatedModels = [...models, { ...newModel, id: Date.now().toString() }];
      updateModels(updatedModels);
      setNewModel({ id: '', name: '', provider: providers[0].name, isDeepThinking: false });
    }
  };

  const handleDeleteModel = async (id: string) => {
    if (!models) return;
    const updatedModels = models.filter(model => model.id !== id);
    updateModels(updatedModels);
  };

  return (
    <div className="w-full mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Models</h2>
      <ul className="space-y-4">
        { models && models.map(model => (
          <li key={model.id} className="bg-background border rounded-lg p-4 flex items-center justify-between">
            {editingModel === model.id ? (
              <div className="flex-1 space-y-2">
                <Input
                  value={model.name}
                  onChange={(e) => handleModelChange(model.id, 'name', e.target.value)}
                  className="w-full"
                />
                <Select
                  value={model.provider}
                  onValueChange={(value) => handleModelChange(model.id, 'provider', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers && providers.map(provider => (
                      <SelectItem key={provider.name} value={provider.name}>{provider.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={model.isDeepThinking}
                    onCheckedChange={(checked) => handleModelChange(model.id, 'isDeepThinking', checked)}
                  />
                  <span className="text-sm">Deep Thinking</span>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" onClick={() => handleSaveEdit()}><Check className="w-4 h-4" /></Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit}><X className="w-4 h-4" /></Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <h3 className="font-semibold">{model.name}</h3>
                  <p className="text-sm text-muted-foreground">{model.provider}</p>
                  {model.isDeepThinking && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">Deep Thinking</span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="ghost" onClick={() => handleEditClick(model.id)}>
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDeleteModel(model.id)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-6 space-y-2">
        <Input
          placeholder="New model name"
          value={newModel.name}
          onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
        />
        <Select
          value={newModel.provider}
          onValueChange={(value) => setNewModel({ ...newModel, provider: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {providers && providers.map(provider => (
              <SelectItem key={provider.name} value={provider.name}>{provider.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2">
          <Switch
            checked={newModel.isDeepThinking}
            onCheckedChange={(checked) => setNewModel({ ...newModel, isDeepThinking: checked })}
          />
          <span className="text-sm">Deep Thinking</span>
        </div>
        <Button onClick={handleAddModel} className="w-full">
          <PlusCircle className="w-4 h-4 mr-2" /> Add Model
        </Button>
      </div>
      <div className='mt-6 space-y-2'>
        
        <h2 className="text-2xl font-bold mb-4">Select Models</h2>
        <Label>
          Choose Model:
        </Label>
        <ModelSelect selectedModel={config.selectedModel}
          label='Select Model'
          models={config.models.filter(model => !model.isDeepThinking)}
          onModelChange={function (model: Model): void {
            updateConfig('selectedModel', model);
          }}></ModelSelect>
        <Label>
          Choose DeepThinking Model:
        </Label>
        <ModelSelect selectedModel={config.selectedDeepThinkingModel}
          label='Select a DeepThinking Model'
          models={config.models.filter(model => model.isDeepThinking)}
          onModelChange={function (model: Model): void {
            updateConfig('selectedDeepThinkingModel', model);
        } }></ModelSelect>
      </div>
    </div>
  );
};

export default ModelsList;
