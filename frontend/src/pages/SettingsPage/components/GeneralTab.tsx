import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Label, RadioGroup, RadioGroupItem, Switch } from '@/shared/ui'
import { useTheme } from '@/shared/components/ThemeProvider'
import { useAdminMode } from '@/shared/hooks'
import { useLanguage, AVAILABLE_LANGUAGES } from '@/shared/hooks/useLanguage'
import { toast } from 'sonner'

const themeOptions = [
  { value: 'light' as const, labelKey: 'general.appearance.light' },
  { value: 'dark' as const, labelKey: 'general.appearance.dark' },
  { value: 'system' as const, labelKey: 'general.appearance.system' },
]

const GeneralTab = () => {
  const { t } = useTranslation('settings')
  const { theme, setTheme } = useTheme()
  const { isAdminMode, toggleAdminMode } = useAdminMode()
  const { language, setLanguage } = useLanguage()

  const handleToggleAdminMode = (checked: boolean) => {
    toggleAdminMode()
    toast.success(checked ? 'Admin Mode Enabled' : 'Admin Mode Disabled')
  }

  return (
    <div className="space-y-6">
      {/* Language Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('general.language.title')}</CardTitle>
          <CardDescription>{t('general.language.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={language} onValueChange={setLanguage}>
            {AVAILABLE_LANGUAGES.map(({ code, nativeLabel }) => (
              <div key={code} className="flex items-center space-x-2">
                <RadioGroupItem value={code} id={`language-${code}`} />
                <Label htmlFor={`language-${code}`} className="font-normal cursor-pointer">
                  {nativeLabel}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Appearance Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('general.appearance.title')}</CardTitle>
          <CardDescription>{t('general.appearance.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-4 block">{t('general.appearance.theme')}</Label>
            <RadioGroup value={theme} onValueChange={setTheme}>
              {themeOptions.map(({ value, labelKey }) => (
                <div key={value} className="flex items-center space-x-2">
                  <RadioGroupItem value={value} id={`theme-${value}`} />
                  <Label htmlFor={`theme-${value}`} className="font-normal cursor-pointer">
                    {t(labelKey)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Admin Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('general.admin.title')}</CardTitle>
          <CardDescription>{t('general.admin.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="admin-mode" className="text-base">
                {t('general.admin.enable')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('general.admin.description')}
              </p>
            </div>
            <Switch
              id="admin-mode"
              checked={isAdminMode}
              onCheckedChange={handleToggleAdminMode}
            />
          </div>

          <div className="rounded-lg border border-semantic-warning/20 bg-semantic-warning/10 p-4">
            <p className="text-sm text-foreground">
              <strong>{t('general.admin.shortcut')}:</strong>{' '}
              <kbd className="px-2 py-2 text-xs font-semibold bg-background border border-border rounded">
                Cmd+Shift+A
              </kbd>{' '}
              (Mac) /{' '}
              <kbd className="px-2 py-2 text-xs font-semibold bg-background border border-border rounded">
                Ctrl+Shift+A
              </kbd>{' '}
              (Windows/Linux)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default GeneralTab
