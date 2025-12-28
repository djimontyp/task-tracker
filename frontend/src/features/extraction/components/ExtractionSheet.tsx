/**
 * ExtractionSheet - AI Knowledge Extraction Panel
 *
 * A slide-out sheet for configuring and launching AI extraction runs.
 * Features period selection, score filtering, provider choice, and live preview.
 *
 * Keyboard shortcuts:
 * - Ctrl/Cmd + Enter: Start extraction
 * - Escape: Close sheet
 * - 1-4: Quick period selection
 *
 * @accessibility
 * - WCAG AA compliant (4.5:1 contrast)
 * - Full keyboard navigation
 * - Focus trap within sheet
 * - aria-labels for all controls
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/shared/ui/sheet';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { Progress } from '@/shared/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { cn } from '@/shared/lib/utils';
import { padding, touchTarget } from '@/shared/tokens/spacing';
import { semantic } from '@/shared/tokens/colors';
import { badges, focus } from '@/shared/tokens/patterns';
import {
  Sparkles,
  Clock,
  Filter,
  Cpu,
  MessageSquare,
  Atom,
  Zap,
  Timer,
  DollarSign,
  ChevronRight,
  Keyboard,
  Calendar,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type TimePeriod = '1h' | '24h' | '7d' | 'custom';
export type ScoreFilter = 'all' | 'medium' | 'high';
export type Provider = 'gpt-4' | 'gpt-4-turbo' | 'ollama-mistral' | 'ollama-llama3';

interface ExtractionPreview {
  messageCount: number;
  estimatedAtoms: number;
  estimatedTime: string;
  estimatedCost: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ExtractionSheetProps {
  /** Controls sheet visibility */
  open: boolean;
  /** Called when sheet should close */
  onOpenChange: (open: boolean) => void;
  /** Called when extraction starts */
  onExtract?: (config: ExtractionConfig) => void;
  /** Total available messages for context */
  totalMessages?: number;
  /** Whether extraction is in progress */
  isExtracting?: boolean;
  /** Current extraction progress (0-100) */
  extractionProgress?: number;
}

export interface ExtractionConfig {
  period: TimePeriod;
  scoreFilter: ScoreFilter;
  provider: Provider;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const PERIOD_OPTIONS: { value: TimePeriod; label: string; shortcut: string; icon: typeof Clock }[] = [
  { value: '1h', label: 'Last Hour', shortcut: '1', icon: Clock },
  { value: '24h', label: 'Last 24 Hours', shortcut: '2', icon: Clock },
  { value: '7d', label: 'Last 7 Days', shortcut: '3', icon: Calendar },
  { value: 'custom', label: 'Custom Range', shortcut: '4', icon: Calendar },
];

const SCORE_OPTIONS: { value: ScoreFilter; label: string; description: string }[] = [
  { value: 'all', label: 'All Messages', description: 'Include everything' },
  { value: 'medium', label: 'Medium+ Priority', description: 'Score >= 0.5' },
  { value: 'high', label: 'High Priority Only', description: 'Score >= 0.75' },
];

const PROVIDER_OPTIONS: { value: Provider; label: string; speed: string; cost: string }[] = [
  { value: 'gpt-4', label: 'GPT-4', speed: 'Slow', cost: '$$$' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', speed: 'Fast', cost: '$$' },
  { value: 'ollama-mistral', label: 'Mistral (Local)', speed: 'Medium', cost: 'Free' },
  { value: 'ollama-llama3', label: 'Llama 3 (Local)', speed: 'Fast', cost: 'Free' },
];

// ═══════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════

interface PeriodCardProps {
  option: typeof PERIOD_OPTIONS[0];
  selected: boolean;
  onSelect: () => void;
}

function PeriodCard({ option, selected, onSelect }: PeriodCardProps) {
  const Icon = option.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative flex flex-col items-center justify-center',
        'rounded-lg border-2 p-4 transition-all duration-200',
        touchTarget.min,
        focus.ring,
        selected
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-border bg-card hover:border-primary/50 hover:bg-accent/50'
      )}
      aria-pressed={selected}
      aria-label={`${option.label}, keyboard shortcut ${option.shortcut}`}
    >
      <Icon className={cn('h-5 w-5 mb-2', selected ? 'text-primary' : 'text-muted-foreground')} />
      <span className={cn('text-sm font-medium', selected ? 'text-primary' : 'text-foreground')}>
        {option.label}
      </span>
      <kbd className="absolute top-1 right-1 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
        {option.shortcut}
      </kbd>
    </button>
  );
}

interface PreviewMetricProps {
  icon: typeof MessageSquare;
  label: string;
  value: string | number;
  subtext?: string;
  variant?: 'default' | 'success' | 'warning';
}

function PreviewMetric({ icon: Icon, label, value, subtext, variant = 'default' }: PreviewMetricProps) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
      <div className={cn(
        'rounded-full p-2',
        variant === 'success' && 'bg-semantic-success/10',
        variant === 'warning' && 'bg-semantic-warning/10',
        variant === 'default' && 'bg-primary/10'
      )}>
        <Icon className={cn(
          'h-5 w-5',
          variant === 'success' && semantic.success.text,
          variant === 'warning' && semantic.warning.text,
          variant === 'default' && 'text-primary'
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold tabular-nums">{value}</p>
        {subtext && <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function ExtractionSheet({
  open,
  onOpenChange,
  onExtract,
  totalMessages = 500,
  isExtracting = false,
  extractionProgress = 0,
}: ExtractionSheetProps) {
  // State
  const [period, setPeriod] = useState<TimePeriod>('24h');
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('medium');
  const [provider, setProvider] = useState<Provider>('gpt-4-turbo');

  // Calculate preview based on selections
  const preview = useMemo((): ExtractionPreview => {
    // Estimate message count based on period
    const periodMultipliers: Record<TimePeriod, number> = {
      '1h': 0.04,
      '24h': 0.2,
      '7d': 0.7,
      'custom': 0.5,
    };
    const baseMessages = Math.round(totalMessages * periodMultipliers[period]);

    // Apply score filter
    const scoreMultipliers: Record<ScoreFilter, number> = {
      all: 1,
      medium: 0.6,
      high: 0.3,
    };
    const filteredMessages = Math.round(baseMessages * scoreMultipliers[scoreFilter]);

    // Estimate atoms (roughly 1 atom per 3-5 messages)
    const atomRatio = scoreFilter === 'high' ? 0.5 : scoreFilter === 'medium' ? 0.35 : 0.25;
    const estimatedAtoms = Math.max(1, Math.round(filteredMessages * atomRatio));

    // Estimate time based on provider and message count
    const timePerMessage: Record<Provider, number> = {
      'gpt-4': 2,
      'gpt-4-turbo': 0.8,
      'ollama-mistral': 1.2,
      'ollama-llama3': 0.6,
    };
    const totalSeconds = Math.round(filteredMessages * timePerMessage[provider]);
    const estimatedTime = totalSeconds < 60
      ? `${totalSeconds}s`
      : totalSeconds < 3600
        ? `${Math.round(totalSeconds / 60)}m`
        : `${Math.round(totalSeconds / 3600)}h ${Math.round((totalSeconds % 3600) / 60)}m`;

    // Estimate cost
    const costPerMessage: Record<Provider, number> = {
      'gpt-4': 0.06,
      'gpt-4-turbo': 0.02,
      'ollama-mistral': 0,
      'ollama-llama3': 0,
    };
    const totalCost = filteredMessages * costPerMessage[provider];
    const estimatedCost = totalCost === 0
      ? 'Free'
      : totalCost < 0.01
        ? '<$0.01'
        : `$${totalCost.toFixed(2)}`;

    // Confidence based on message count
    const confidence: ExtractionPreview['confidence'] =
      filteredMessages < 10 ? 'low' : filteredMessages < 50 ? 'medium' : 'high';

    return {
      messageCount: filteredMessages,
      estimatedAtoms,
      estimatedTime,
      estimatedCost,
      confidence,
    };
  }, [period, scoreFilter, provider, totalMessages]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open) return;

    // Period shortcuts (1-4)
    if (e.key >= '1' && e.key <= '4' && !e.metaKey && !e.ctrlKey) {
      const index = parseInt(e.key) - 1;
      if (PERIOD_OPTIONS[index]) {
        setPeriod(PERIOD_OPTIONS[index].value);
      }
    }

    // Start extraction (Cmd/Ctrl + Enter)
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !isExtracting) {
      e.preventDefault();
      onExtract?.({ period, scoreFilter, provider });
    }
  }, [open, period, scoreFilter, provider, isExtracting, onExtract]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleExtract = () => {
    onExtract?.({ period, scoreFilter, provider });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto"
        aria-describedby="extraction-sheet-description"
      >
        <SheetHeader className="space-y-1 pb-6">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary/10 p-2">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <SheetTitle className="text-xl">AI Extraction</SheetTitle>
          </div>
          <SheetDescription id="extraction-sheet-description">
            Extract knowledge atoms from your messages using AI analysis.
          </SheetDescription>
        </SheetHeader>

        <div className={cn('space-y-8', padding.section.mobile)}>
          {/* Period Selection */}
          <section aria-labelledby="period-heading">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 id="period-heading" className="text-sm font-semibold">Time Period</h3>
            </div>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="period-heading">
              {PERIOD_OPTIONS.map((option) => (
                <PeriodCard
                  key={option.value}
                  option={option}
                  selected={period === option.value}
                  onSelect={() => setPeriod(option.value)}
                />
              ))}
            </div>
          </section>

          <Separator />

          {/* Score Filter */}
          <section aria-labelledby="score-heading">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h3 id="score-heading" className="text-sm font-semibold">Message Filter</h3>
            </div>
            <Select value={scoreFilter} onValueChange={(v) => setScoreFilter(v as ScoreFilter)}>
              <SelectTrigger className="w-full h-12" aria-label="Select score filter">
                <SelectValue placeholder="Select filter" />
              </SelectTrigger>
              <SelectContent>
                {SCORE_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="py-3"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          <Separator />

          {/* Provider Selection */}
          <section aria-labelledby="provider-heading">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <h3 id="provider-heading" className="text-sm font-semibold">AI Provider</h3>
            </div>
            <Select value={provider} onValueChange={(v) => setProvider(v as Provider)}>
              <SelectTrigger className="w-full h-12" aria-label="Select AI provider">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="py-3"
                  >
                    <div className="flex items-center justify-between w-full gap-4">
                      <span className="font-medium">{option.label}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          {option.speed}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {option.cost}
                        </Badge>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          <Separator />

          {/* Preview Panel */}
          <section
            aria-labelledby="preview-heading"
            className="rounded-xl border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 id="preview-heading" className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Extraction Preview
              </h3>
              <Badge
                variant="outline"
                className={cn(
                  preview.confidence === 'high' && badges.status.connected,
                  preview.confidence === 'medium' && badges.status.validating,
                  preview.confidence === 'low' && badges.status.pending
                )}
              >
                {preview.confidence === 'high' && <CheckCircle className="h-3 w-3 mr-1" />}
                {preview.confidence === 'medium' && <AlertTriangle className="h-3 w-3 mr-1" />}
                {preview.confidence === 'low' && <AlertTriangle className="h-3 w-3 mr-1" />}
                {preview.confidence} confidence
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <PreviewMetric
                icon={MessageSquare}
                label="Messages Selected"
                value={preview.messageCount.toLocaleString()}
                subtext={`of ${totalMessages.toLocaleString()} total`}
              />
              <PreviewMetric
                icon={Atom}
                label="Expected Atoms"
                value={`~${preview.estimatedAtoms}`}
                subtext="knowledge units"
                variant="success"
              />
              <PreviewMetric
                icon={Timer}
                label="Estimated Time"
                value={preview.estimatedTime}
              />
              <PreviewMetric
                icon={DollarSign}
                label="Estimated Cost"
                value={preview.estimatedCost}
                variant={preview.estimatedCost === 'Free' ? 'success' : 'default'}
              />
            </div>

            {/* Value proposition */}
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{preview.messageCount} messages</span>
              <ArrowRight className="h-4 w-4" />
              <span className="font-semibold text-primary">{preview.estimatedAtoms} decisions</span>
            </div>
          </section>

          {/* Extraction Progress */}
          {isExtracting && (
            <div className="space-y-2 animate-in fade-in-50 slide-in-from-bottom-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting knowledge...
                </span>
                <span className="font-medium">{extractionProgress}%</span>
              </div>
              <Progress value={extractionProgress} className="h-2" />
            </div>
          )}
        </div>

        <SheetFooter className="mt-8 pt-6 border-t flex-col gap-4">
          {/* Keyboard shortcuts hint */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Keyboard className="h-3 w-3" />
              <span>1-4 for period</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px]">
                {navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+Enter
              </kbd>
              <span>to start</span>
            </div>
          </div>

          <Button
            onClick={handleExtract}
            disabled={isExtracting || preview.messageCount === 0}
            className={cn('w-full', touchTarget.min)}
            size="lg"
          >
            {isExtracting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Start Extraction
                <ChevronRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default ExtractionSheet;
