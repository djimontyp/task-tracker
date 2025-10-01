import React from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Label } from '@shared/ui'
import { useUiStore } from '@shared/store/uiStore'

const SettingsPage = () => {
  const { theme, setTheme } = useUiStore()

  return (
    <div className="space-y-6 sm:space-y-7 md:space-y-8">
      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-medium text-foreground mb-3 block">Theme Preference</Label>
            <p className="text-sm text-muted-foreground mb-4">Choose your preferred color theme</p>
            <div className="flex gap-3">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
                className="flex-1 sm:flex-none"
              >
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
                className="flex-1 sm:flex-none"
              >
                Dark
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Label className="text-base font-medium text-foreground">Email Notifications</Label>
              <p className="text-sm text-muted-foreground mt-1">Receive email updates about tasks and assignments</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                defaultChecked
                role="switch"
                aria-label="Enable email notifications"
                aria-checked="true"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-start justify-between gap-4 pt-4 border-t border-border">
            <div className="flex-1">
              <Label className="text-base font-medium text-foreground">Desktop Notifications</Label>
              <p className="text-sm text-muted-foreground mt-1">Show browser notifications for task updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                role="switch"
                aria-label="Enable desktop notifications"
                aria-checked="false"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">About</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground w-32">Version:</span>
              <span className="text-muted-foreground">1.0.0</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground w-32">API URL:</span>
              <span className="text-muted-foreground break-all">{process.env.REACT_APP_API_URL || 'http://localhost:8000'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground w-32">WebSocket URL:</span>
              <span className="text-muted-foreground break-all">{process.env.REACT_APP_WS_URL || 'http://localhost:8000'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SettingsPage