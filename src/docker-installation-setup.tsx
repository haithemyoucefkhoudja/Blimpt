"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Steps, Step } from "@/components/ui/steps"
import { ExternalLink } from "lucide-react"

export function DockerInstallGuide() {
  const [completedSteps, setCompletedSteps] = React.useState<number[]>([])

  const toggleStep = (step: number) => {
    setCompletedSteps((prev) => (prev.includes(step) ? prev.filter((s) => s !== step) : [...prev, step]))
  }

  const steps = [
    "Check system requirements",
    "Download Docker Desktop",
    "Run the installer",
    "Start Docker Desktop",
    "Verify installation",
  ]

  return (
    <Card className="w-full  mx-auto px-0 border-0 bg-inherit">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Install Docker</CardTitle>
        <CardDescription className="text-muted-foreground">
          Follow these steps to install Docker on your Windows machine
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Steps>
          {steps.map((step, index) => (
            <Step key={index} className="pb-4">
              <div className="flex items-center">
                <Checkbox
                  checked={completedSteps.includes(index)}
                  onCheckedChange={() => toggleStep(index)}
                  className="mr-2"
                />
                <span
                  className={completedSteps.includes(index) ? "text-muted-foreground line-through" : "text-foreground"}
                >
                  {step}
                </span>
              </div>
            </Step>
          ))}
        </Steps>
        
      </CardContent>
      <CardFooter className="flex  space-y-2 flex-col">
        <Button
          variant="outline"
          onClick={() => window.open("https://docs.docker.com/desktop/install/windows-install/", "_blank")}
        >
          View Full Guide
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
        <Button
          variant="default"
          onClick={() =>
            window.open("https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe", "_blank")
          }
        >
          Download Docker Desktop
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

