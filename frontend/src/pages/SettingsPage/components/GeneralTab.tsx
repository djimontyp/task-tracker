import { Card, CardContent, CardDescription, CardHeader, CardTitle, Label, RadioGroup, RadioGroupItem } from '@/shared/ui'
import { useTheme } from '@/shared/components/ThemeProvider'

const themeOptions = [
  { value: 'light' as const, label: 'Light' },
  { value: 'dark' as const, label: 'Dark' },
  { value: 'system' as const, label: 'System' },
]

const GeneralTab = () => {
  const { theme, setTheme } = useTheme()

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
    </div>
  )
}

export default GeneralTab
