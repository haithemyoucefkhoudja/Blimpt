import { X } from "lucide-react"
import { Button } from "./ui/button"
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

function HideButton() {
    
  function closeWindow(): void {
    
    const windowInstance = getCurrentWebviewWindow();
    windowInstance.hide();
  }
  return (
    <Button className="rounded-full"  size='icon' variant='ghost' onClick={() => closeWindow()}>
          <X className="h-6 w-6"></X>
    </Button>
        
  )
}

export default HideButton
