import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const CHAT_IDS_STORAGE_KEY = 'telegram_import_chat_ids';
import { Download, Play, Info, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { Label } from '@/shared/ui/label';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib';
import { semantic } from '@/shared/tokens';
import { ChatIdInput } from './ChatIdInput';
import { useMessageEstimate } from '../hooks/useMessageEstimate';
import type { ImportDepth, ImportDepthOption } from '../types';
import { IMPORT_DEPTH_OPTIONS } from '../types';

export interface HistoryImportSectionProps {
  /** Callback when import is started */
  onStartImport: (depth: ImportDepth, chatIds: string[]) => void;
  /** Whether import button should be disabled */
  disabled?: boolean;
  /** Whether import is currently starting */
  isStarting?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * History import section with depth selection
 *
 * Features:
 * - RadioGroup for import depth selection (Skip / 24h / 7d / 30d / All)
 * - Shows estimated message counts from Telegram API
 * - Warning callout for "All" option (rate limits)
 * - 44px touch target buttons per design system
 *
 * @example
 * <HistoryImportSection
 *   onStartImport={(depth) => startImport(depth)}
 *   isStarting={mutation.isPending}
 * />
 */
export function HistoryImportSection({
  onStartImport,
  disabled = false,
  isStarting = false,
  className,
}: HistoryImportSectionProps) {
  const { t } = useTranslation('onboarding');
  const [selectedDepth, setSelectedDepth] = useState<ImportDepth>('7d');
  const [chatIds, setChatIds] = useState<string[]>(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(CHAT_IDS_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved) as string[];
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  // Save to localStorage when chatIds change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CHAT_IDS_STORAGE_KEY, JSON.stringify(chatIds));
    }
  }, [chatIds]);

  const {
    isLoading: isEstimateLoading,
    isError: isEstimateError,
    isRateLimited,
    retryAfter,
    refetch: refetchEstimate,
    getCountForDepth,
  } = useMessageEstimate({ chatIds });

  const selectedOption = IMPORT_DEPTH_OPTIONS.find((opt) => opt.value === selectedDepth);
  const showWarning = selectedOption?.isWarning ?? false;

  // Can start import if we have at least one chat ID (or skipping)
  const canStartImport = selectedDepth === 'skip' || chatIds.length > 0;

  const handleAddChatId = useCallback((chatId: string) => {
    setChatIds((prev) => [...prev, chatId]);
  }, []);

  const handleRemoveChatId = useCallback((chatId: string) => {
    setChatIds((prev) => prev.filter((id) => id !== chatId));
  }, []);

  const handleStartImport = () => {
    onStartImport(selectedDepth, chatIds);
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <CardTitle>{t('import.title')}</CardTitle>
        </div>
        <CardDescription>{t('import.description')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Chat ID Input */}
        <ChatIdInput
          chatIds={chatIds}
          onAdd={handleAddChatId}
          onRemove={handleRemoveChatId}
          disabled={disabled || isStarting}
        />

        {/* Total Messages Count with Refresh */}
        {chatIds.length > 0 && (
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t('import.estimate.totalMessages')}:
              </span>
              {isEstimateLoading ? (
                <span className="text-sm text-muted-foreground">{t('import.estimate.loading')}</span>
              ) : isEstimateError ? (
                <span className="text-sm text-destructive">{t('import.estimate.unavailable')}</span>
              ) : (
                <span className="text-sm font-medium">
                  {(getCountForDepth('all') ?? 0).toLocaleString()} {t('import.estimate.messagesLabel')}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={refetchEstimate}
              disabled={isEstimateLoading}
              className="h-8 px-2"
              aria-label={t('import.estimate.refresh')}
            >
              <RefreshCw className={cn('h-4 w-4', isEstimateLoading && 'animate-spin')} />
            </Button>
          </div>
        )}

        {/* Depth Selection */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">{t('import.depth.label')}</Label>

          <RadioGroup
            value={selectedDepth}
            onValueChange={(value) => setSelectedDepth(value as ImportDepth)}
            className="space-y-2"
          >
            {IMPORT_DEPTH_OPTIONS.map((option) => (
              <DepthOption
                key={option.value}
                option={option}
                isSelected={selectedDepth === option.value}
                count={option.value !== 'skip' ? getCountForDepth(option.value) : null}
                isLoading={isEstimateLoading && chatIds.length > 0}
              />
            ))}
          </RadioGroup>
        </div>

        {/* Estimate Info */}
        {!isEstimateError && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{t('import.estimate.info')}</span>
          </div>
        )}

        {/* Rate Limit Error */}
        {isEstimateError && (
          <Alert variant="destructive" className="border-semantic-error">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p>
                {isRateLimited
                  ? t('import.error.rateLimited', { seconds: retryAfter || 60 })
                  : t('import.error.fetchFailed')}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={refetchEstimate}
                className="h-8"
              >
                {t('import.estimate.retry')}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Warning for "All" option */}
        {showWarning && (
          <Alert className={cn('border-semantic-warning', semantic.warning.bg, 'bg-opacity-10')}>
            <AlertTriangle className={cn('h-4 w-4', semantic.warning.text)} />
            <AlertDescription className={semantic.warning.text}>
              {t('import.warning.all')}
            </AlertDescription>
          </Alert>
        )}

        {/* Estimate info when error - can still import */}
        {isEstimateError && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{t('import.estimate.canImportAnyway')}</span>
          </div>
        )}

        {/* Start Import Button - 44px touch target */}
        <Button
          onClick={handleStartImport}
          disabled={disabled || isStarting || !canStartImport}
          className="w-full h-11"
          size="lg"
        >
          <Play className="h-4 w-4 mr-2" aria-hidden="true" />
          {isStarting
            ? t('import.actions.starting')
            : !canStartImport
              ? t('import.actions.addChatFirst')
              : isEstimateError
                ? t('import.actions.startAnyway')
                : t('import.actions.start')}
        </Button>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// DEPTH OPTION COMPONENT
// ═══════════════════════════════════════════════════════════════

interface DepthOptionProps {
  option: ImportDepthOption;
  isSelected: boolean;
  count: number | null;
  isLoading?: boolean;
}

function DepthOption({ option, isSelected, count, isLoading = false }: DepthOptionProps) {
  const { t } = useTranslation('onboarding');

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-lg border p-4 transition-colors',
        isSelected && 'border-primary bg-primary/5',
        option.isWarning && isSelected && 'border-semantic-warning bg-semantic-warning/5'
      )}
    >
      <div className="flex items-center gap-4">
        <RadioGroupItem value={option.value} id={`depth-${option.value}`} />
        <Label
          htmlFor={`depth-${option.value}`}
          className="flex items-center gap-2 cursor-pointer"
        >
          <span>{t(option.labelKey)}</span>
          {option.isRecommended && (
            <Badge variant="secondary" className="text-xs">
              {t('import.depth.recommended')}
            </Badge>
          )}
          {option.isWarning && (
            <AlertTriangle
              className={cn('h-4 w-4', semantic.warning.text)}
              aria-label={t('import.depth.longProcessing')}
            />
          )}
        </Label>
      </div>

      {/* Message count for this depth */}
      {option.value !== 'skip' && (
        <div className="ml-auto text-sm text-muted-foreground">
          {isLoading ? (
            <span>{t('import.estimate.loading')}</span>
          ) : count !== null ? (
            <span className="font-medium">{count.toLocaleString()}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}
