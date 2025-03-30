import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/small-wide-select"
import { ScrollArea } from '../ui/scroll-area'
import { useConfig } from '@/providers/config-provider'

interface SearchModeSelectProps {
  searchModes: string[]
  selectedSearchMode: string
  onSearchModeChange: (searchMode: string) => void
}

const SearchModeSelect: React.FC<SearchModeSelectProps> = ({ searchModes, selectedSearchMode, onSearchModeChange }) => {
  const { port, isSearch } = useConfig();
  return (
    <Select disabled={!port || !isSearch}  value={selectedSearchMode} onValueChange={(val)=>(onSearchModeChange(val || searchModes[0]))}>
      <SelectTrigger className="max-w-[120px] h-8">
        <SelectValue placeholder="Select a mode" />
      </SelectTrigger>
          <SelectContent>
              <div className='overflow-y-hidden max-h-[100px]'>
                <ScrollArea className='h-full'>
                
                        {searchModes.map((searchMode) => (
                        <SelectItem key={searchMode} value={searchMode}>
                            {searchMode}
                        </SelectItem>
                        ))}
                </ScrollArea>
              </div>
      </SelectContent>
    </Select>
  )
}

export default SearchModeSelect