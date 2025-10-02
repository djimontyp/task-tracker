import React from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Label } from '@shared/ui'
import { useTheme } from '../../components/ThemeProvider'
import { cn } from '@/shared/lib/utils'

const themeOptions: { value: 'light' | 'dark' | 'system'; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' }
]

const SettingsPage = () => {
  const { theme, setTheme, effectiveTheme } = useTheme()

  return (
    <div className="space-y-6 sm:space-y-7 md:space-y-8">

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-medium text-foreground mb-4 block">Theme Preference</Label>
            <div className="flex flex-wrap gap-2">
              {themeOptions.map(({ value, label }) => {
                const isActive = theme === value
                return (
                  <Button
                    key={value}
                    type="button"
                    variant="outline"
                    onClick={() => setTheme(value)}
                    className={cn(
                      'flex-1 min-w-[96px] sm:flex-none rounded-full px-4 py-2 text-sm font-semibold transition-colors ease-out',
                      isActive
                        ? 'border-primary bg-primary/90 text-primary-foreground shadow-sm hover:bg-primary'
                        : 'border-muted-foreground/60 text-muted-foreground hover:border-muted-foreground hover:bg-muted/40 hover:text-foreground'
                    )}
                  >
                    {label}
                  </Button>
                )
              })}
            </div>
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