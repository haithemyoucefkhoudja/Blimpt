import { Badge } from "../ui/badge"
import { Card, CardContent } from "../ui/card"
import HideButton from "../HideButton";

function FirstRender() {
    return (
        <Card 
        data-tauri-drag-region className="w-[280px] shadow-lg bg-background/95 rounded-xl backdrop-blur border-neutral-500/80">
        <CardContent
          data-tauri-drag-region
          className="p-0">
          <div className="w-full items-center flex justify-end p-4">
              <HideButton></HideButton>
          </div>
          <div 
            data-tauri-drag-region
            className="w-full aspect-square flex items-center justify-center">
            <object
              type="image/svg+xml"
              data="/animated.svg"
              className="w-full h-full p-0"
            >
              Your browser does not support SVG
            </object>
          </div>
          <div 
            data-tauri-drag-region
            className="p-4 text-center">
            <h3 className="font-semibold text-sm mb-1">AI Assistant</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Always here to help
            </p>
            <p className="text-sm text-neutral-600 mb-3">
              You can call me anytime by pressing:
            </p>
            <div className="flex items-center justify-center gap-1.5">
              <Badge variant="secondary" className="text-xs">
                Command
              </Badge>
              
              <span className="text-xs text-muted-foreground">+</span>
              <Badge variant="secondary" className="text-xs">
                Shift
              </Badge>
              <span className="text-xs text-muted-foreground">+</span>
              <Badge variant="secondary" className="text-xs">
                Y
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>  
  )
}

export default FirstRender
