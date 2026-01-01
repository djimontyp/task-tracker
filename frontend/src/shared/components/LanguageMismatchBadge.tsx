import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';

interface LanguageMismatchBadgeProps {
  detectedLanguage?: string;
  expectedLanguage?: string;
  className?: string;
}

/**
 * Badge component to indicate when AI-generated content language
 * differs from the expected project language.
 *
 * Shows a warning badge with tooltip explanation when languages don't match.
 */
export function LanguageMismatchBadge({
  detectedLanguage,
  expectedLanguage,
  className,
}: LanguageMismatchBadgeProps) {
  const { t } = useTranslation('validation');

  // Don't show badge if languages match or if info is missing
  if (!detectedLanguage || !expectedLanguage || detectedLanguage === expectedLanguage) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`gap-2 border-semantic-warning text-semantic-warning ${className ?? ''}`}
          >
            <AlertTriangle className="h-3 w-3" />
            {t('languageMismatch.badge')}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('languageMismatch.description')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
