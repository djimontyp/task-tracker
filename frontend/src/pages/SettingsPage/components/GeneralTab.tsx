import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Label } from '@/shared/ui'
import { useTheme } from '@/shared/components/ThemeProvider'

const themeOptions = [
  { value: 'light' as const, label: 'Light' },
  { value: 'dark' as const, label: 'Dark' },
  { value: 'system' as const, label: 'System' },
]

const GeneralTab = () => {
  const { theme, setTheme } = useTheme()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Customize how the application looks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium mb-3 block">Theme</Label>
          <div className="flex flex-wrap gap-2">
            {themeOptions.map(({ value, label }) => (
              <Button
                key={value}
                type="button"
                variant={theme === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme(value)}
                aria-pressed={theme === value}
                className="min-w-[80px]"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default GeneralTab
