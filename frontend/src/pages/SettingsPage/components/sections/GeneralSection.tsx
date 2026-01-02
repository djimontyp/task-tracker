/**
 * GeneralSection - General settings (Appearance, Language, Admin Mode)
 *
 * Contains user preferences that are frequently accessed.
 * Uses inline controls (dropdowns, toggles) instead of opening sheets.
 */

import { useTranslation } from 'react-i18next';
import { Palette, Globe, Shield } from 'lucide-react';
import { toast } from 'sonner';

import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Switch } from '@/shared/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { useTheme } from '@/shared/components/ThemeProvider';
import { useAdminMode } from '@/shared/hooks';
import { useLanguage, AVAILABLE_LANGUAGES, type LanguageCode } from '@/shared/hooks/useLanguage';

import { SettingsSection } from '../SettingsSection';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type Theme = 'light' | 'dark' | 'system';

const themeLabels: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

// ═══════════════════════════════════════════════════════════════
// INLINE SETTING CARD
// ═══════════════════════════════════════════════════════════════

interface InlineSettingCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

function InlineSettingCard({
  icon: Icon,
  title,
  description,
  children,
  className,
}: InlineSettingCardProps) {
  return (
    <Card className={className}>
      <div className="flex items-center gap-4 p-4">
        {/* Icon */}
        <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{title}</div>
          <div className="text-xs text-muted-foreground">
            {description}
          </div>
        </div>

        {/* Control */}
        <div className="flex-shrink-0">{children}</div>
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function GeneralSection() {
  const { t } = useTranslation('settings');
  const { theme, setTheme } = useTheme();
  const { isAdminMode, toggleAdminMode } = useAdminMode();
  const { language, setLanguage } = useLanguage();

  const handleThemeChange = (value: string) => {
    setTheme(value as Theme);
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value as LanguageCode);
  };

  const handleAdminToggle = (checked: boolean) => {
    toggleAdminMode();
    toast.success(
      checked ? t('general.admin.enabled') : t('general.admin.disabled')
    );
  };

  // Get current language label
  const currentLangLabel =
    AVAILABLE_LANGUAGES.find((l) => l.code === language)?.nativeLabel ||
    'English';

  return (
    <SettingsSection title={t('sections.general', 'General')}>
      {/* Appearance */}
      <InlineSettingCard
        icon={Palette}
        title={t('general.appearance.title', 'Appearance')}
        description={t('general.appearance.description', 'Color theme')}
      >
        <Select value={theme} onValueChange={handleThemeChange}>
          <SelectTrigger className="w-[100px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(themeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value} className="text-xs">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </InlineSettingCard>

      {/* Language */}
      <InlineSettingCard
        icon={Globe}
        title={t('general.language.title', 'Language')}
        description={t('general.language.description', 'Interface language')}
      >
        <Select value={language} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue>{currentLangLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_LANGUAGES.map(({ code, nativeLabel }) => (
              <SelectItem key={code} value={code} className="text-xs">
                {nativeLabel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </InlineSettingCard>

      {/* Admin Mode */}
      <InlineSettingCard
        icon={Shield}
        title={t('general.admin.title', 'Admin Mode')}
        description={t('general.admin.description', 'Advanced features')}
      >
        <div className="flex items-center gap-2">
          {isAdminMode && (
            <Badge
              variant="outline"
              className="border-status-connected bg-status-connected/10 text-status-connected text-xs"
            >
              ON
            </Badge>
          )}
          <Switch
            checked={isAdminMode}
            onCheckedChange={handleAdminToggle}
            aria-label={t('general.admin.toggle', 'Toggle admin mode')}
          />
        </div>
      </InlineSettingCard>
    </SettingsSection>
  );
}
