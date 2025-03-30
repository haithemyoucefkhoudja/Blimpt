import { cn } from '@/lib/utils'
import {  MessageCirclePlus } from 'lucide-react'

import { Button } from '../ui/button'

interface NewChatIndicatorProps { 
    activeWindow: string;
    setActiveWindow: () => void;
    isLoading: boolean;
    newChatStarter: () => void;
  }
function NewChatIndicator({ activeWindow, isLoading, newChatStarter, setActiveWindow }: NewChatIndicatorProps

) {
  const handleClick = () => {
    if (isLoading)
      return;
    
    if (activeWindow !== 'chat') {
      setActiveWindow();
    }
    newChatStarter();
    
    }
  return (
    <Button disabled={isLoading} onClick={handleClick} variant='ghost' type="button" size="icon" className={cn("rounded-full flex-shrink-0  relative")}>
          
          <MessageCirclePlus className="h-6 w-6" />
    </Button>
  )
}

export default NewChatIndicator
