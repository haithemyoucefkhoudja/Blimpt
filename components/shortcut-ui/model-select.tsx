import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/small-wide-select"
import { ScrollArea } from '../ui/scroll-area'
import { Model } from '@/types/settings/model'

interface ModelSelectProps {
  models: Model[]
  selectedModel: Model | null
  onModelChange: (model: Model) => void
  label: string;
}

const ModelSelect: React.FC<ModelSelectProps> = ({ models, selectedModel, onModelChange, label }) => {
  return (
    <Select  value={selectedModel?.name + '||'+ selectedModel?.provider} onValueChange={(val)=>onModelChange(models.find(model=> model.name + "||" + model.provider ==val) || models[0])}>
      <SelectTrigger className="max-w-[120px] h-8">
        <SelectValue placeholder={label} />
      </SelectTrigger>
          <SelectContent>
              <div className='overflow-y-hidden max-h-[100px]'>
                  <ScrollArea className='h-full'>
                  <div className=" block">
                        {models.map((model) => (
                        <SelectItem key={model.name + "||" + model.provider} value={model.name + "||" + model.provider}>
                            {model.name + "||" + model.provider}
                        </SelectItem>
                        ))}
                    </div>
                </ScrollArea>
              </div>
      </SelectContent>
    </Select>
  )
}

export default ModelSelect