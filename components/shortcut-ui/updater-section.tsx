"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle, Download, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface UpdateInfo {
  version: string
  date: string
  body: string
}

const UpdaterSection = () => {
  const [checking, setChecking] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [downloadComplete, setDownloadComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkForUpdates = async () => {
    setChecking(true)
    setError(null)
    
    try {
      // Import dynamically to prevent errors in non-Tauri environments
      const { check } = await import('@tauri-apps/plugin-updater')
      const update = await check()
      
      if (update) {
        setUpdateAvailable({
          version: update.version,
          date: update.date,
          body: update.body
        })
      } else {
        setUpdateAvailable(null)
      }
    } catch (err) {
      console.error('Error checking for updates:', err)
      setError('Failed to check for updates. Please try again later.')
    } finally {
      setChecking(false)
    }
  }

  const downloadAndInstallUpdate = async () => {
    if (!updateAvailable) return
    
    setDownloading(true)
    setDownloadProgress(0)
    setError(null)
    
    try {
      const { check } = await import('@tauri-apps/plugin-updater')
      const { relaunch } = await import('@tauri-apps/plugin-process')
      
      const update = await check()
      if (!update) {
        setError('Update is no longer available')
        setDownloading(false)
        return
      }
      
      let downloaded = 0
      let contentLength = 0
      
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength
            console.log(`Started downloading ${contentLength} bytes`)
            break
          case 'Progress':
            downloaded += event.data.chunkLength
            const progress = Math.round((downloaded / contentLength) * 100)
            setDownloadProgress(progress)
            console.log(`Downloaded ${downloaded} from ${contentLength}`)
            break
          case 'Finished':
            console.log('Download finished')
            setDownloadComplete(true)
            break
        }
      })
      
      console.log('Update installed')
      await relaunch()
    } catch (err) {
      console.error('Error installing update:', err)
      setError('Failed to install update. Please try again later.')
      setDownloading(false)
    }
  }

  // Check for updates when component mounts
  useEffect(() => {
    checkForUpdates()
  }, [])

  return (
    <Card className="w-full mt-6 border-0 bg-background shadow-none">
      <CardHeader>
        <CardTitle>Software Updates</CardTitle>
        <CardDescription>Check for and install application updates</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {updateAvailable ? (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Update Available</AlertTitle>
              <AlertDescription>
                Version {updateAvailable.version} is available (released on {updateAvailable.date})
              </AlertDescription>
            </Alert>
            
            {updateAvailable.body && (
              <div className="text-sm">
                <h4 className="font-medium mb-1">Release Notes:</h4>
                <p className="text-muted-foreground">{updateAvailable.body}</p>
              </div>
            )}
            
            {downloading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Downloading update...</span>
                  <span>{downloadProgress}%</span>
                </div>
                <Progress value={downloadProgress} className="w-full" />
              </div>
            )}
            
            {downloadComplete && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle className="text-green-700">Download Complete</AlertTitle>
                <AlertDescription className="text-green-600">
                  Update has been downloaded and will be installed when you restart the application.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="text-left py-4">
            <p className="text-muted-foreground mb-4">
              {checking ? "Checking for updates..." : "Your application is up to date."}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={checkForUpdates} 
          disabled={checking || downloading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${checking ? "animate-spin" : ""}`} />
          Check for Updates
        </Button>
        
        {updateAvailable && !downloadComplete && (
          <Button 
            onClick={downloadAndInstallUpdate} 
            disabled={downloading}
          >
            {downloading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download & Install
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export default UpdaterSection
