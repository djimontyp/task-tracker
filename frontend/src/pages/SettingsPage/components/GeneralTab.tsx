import { Card, CardContent, CardDescription, CardHeader, CardTitle, Label, RadioGroup, RadioGroupItem, Switch } from '@/shared/ui'
import { useTheme } from '@/shared/components/ThemeProvider'
import { useAdminMode } from '@/shared/hooks'
import { toast } from 'sonner'

const themeOptions = [
  { value: 'light' as const, label: 'Light' },
  { value: 'dark' as const, label: 'Dark' },
  { value: 'system' as const, label: 'System' },
]

const GeneralTab = () => {
  const { theme, setTheme } = useTheme()
  const { isAdminMode, toggleAdminMode } = useAdminMode()

  const handleToggleAdminMode = (checked: boolean) => {
    toggleAdminMode()
    toast.success(checked ? 'Admin Mode Enabled' : 'Admin Mode Disabled')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how the application looks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-3 block">Theme</Label>
            <RadioGroup value={theme} onValueChange={setTheme}>
              {themeOptions.map(({ value, label }) => (
                <div key={value} className="flex items-center space-x-2">
                  <RadioGroupItem value={value} id={`theme-${value}`} />
                  <Label htmlFor={`theme-${value}`} className="font-normal cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin Settings</CardTitle>
          <CardDescription>Configure administrative features and diagnostics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="admin-mode" className="text-base">
                Enable Admin Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                Show admin tools, bulk operations, and diagnostic features
              </p>
            </div>
            <Switch
              id="admin-mode"
              checked={isAdminMode}
              onCheckedChange={handleToggleAdminMode}
            />
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950 p-4">
            <p className="text-sm text-gray-700 dark:text-amber-100">
              <strong>Keyboard shortcut:</strong> Press{' '}
              <kbd className="px-2 py-1 text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
                Cmd+Shift+A
              </kbd>{' '}
              (Mac) or{' '}
              <kbd className="px-2 py-1 text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
                Ctrl+Shift+A
              </kbd>{' '}
              (Windows/Linux) to quickly toggle Admin Mode from anywhere in the app.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default GeneralTab
