import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Progress,
} from '@/shared/ui';
import { Sparkles, Loader2, XCircle } from 'lucide-react';
import { TimeWindowSelector } from '@/features/analysis/components/TimeWindowSelector';
import { knowledgeService } from '@/features/knowledge/api/knowledgeService';
import { useWebSocket } from '@/shared/hooks';
import { agentService } from '@/features/agents/api/agentService';
import type { AgentConfig } from '@/features/agents/types/agent';
import type { ExtractionProgress, PeriodType, PeriodRequest } from '@/features/knowledge/types';
import { toast } from 'sonner';
import { isKnowledgeEvent, type KnowledgeEvent } from '@/shared/types/websocket';

/**
 * Compact action button that opens a sheet for quick knowledge extraction.
 * Shows inline in the Messages page toolbar.
 */
export function RunAnalysisAction() {
  const { t } = useTranslation('extraction');
  const { t: tAtoms } = useTranslation('atoms');
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [agentConfigs, setAgentConfigs] = useState<AgentConfig[]>([]);
  const [agentConfigsLoading, setAgentConfigsLoading] = useState(true);
  const [agentConfigId, setAgentConfigId] = useState<string>('');
  const [extracting, setExtracting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [extractionId, setExtractionId] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState({ start: '', end: '' });
  const [progress, setProgress] = useState<ExtractionProgress>({
    status: 'idle',
    topics_created: 0,
    atoms_created: 0,
    versions_created: 0,
  });

  // Load agent configs when sheet opens
  useEffect(() => {
    if (!open) return;

    const fetchAgentConfigs = async () => {
      try {
        setAgentConfigsLoading(true);
        const configs = await agentService.listAgents({ active_only: true });
        setAgentConfigs(configs);

        if (configs.length > 0 && !agentConfigId) {
          setAgentConfigId(configs[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch agent configs:', error);
        toast.error(tAtoms('extraction.errors.loadAgents'));
      } finally {
        setAgentConfigsLoading(false);
      }
    };

    fetchAgentConfigs();
  }, [open, agentConfigId, tAtoms]);

  // Listen for extraction progress via WebSocket
  useWebSocket({
    topics: ['knowledge'],
    onMessage: (data: unknown) => {
      if (!isKnowledgeEvent(data as KnowledgeEvent)) return;

      const event = data as KnowledgeEvent;

      if (event.type === 'knowledge.extraction_started') {
        setProgress((prev) => ({ ...prev, status: 'running' }));
        toast.success(tAtoms('extraction.notifications.started', { count: event.data?.message_count || 0 }));
      } else if (event.type === 'knowledge.topic_created') {
        setProgress((prev) => ({
          ...prev,
          topics_created: prev.topics_created + 1,
        }));
      } else if (event.type === 'knowledge.atom_created') {
        setProgress((prev) => ({
          ...prev,
          atoms_created: prev.atoms_created + 1,
        }));
      } else if (event.type === 'knowledge.version_created') {
        setProgress((prev) => ({
          ...prev,
          versions_created: prev.versions_created + 1,
        }));
      } else if (event.type === 'knowledge.extraction_completed') {
        setProgress((prev) => ({ ...prev, status: 'completed' }));
        setExtracting(false);
        const stats = event.data || {};

        const versionsCreated = stats.versions_created || 0;
        const atomsCreated = stats.atoms_created || 0;
        const topicsCreated = stats.topics_created || 0;

        toast.success(
          tAtoms('extraction.notifications.completed', { atoms: atomsCreated, versions: versionsCreated }),
          {
            duration: 8000,
            description: topicsCreated > 0 ? tAtoms('extraction.notifications.topicsIdentified', { count: topicsCreated }) : undefined,
          }
        );

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['topics'] });
        queryClient.invalidateQueries({ queryKey: ['atoms'] });
        queryClient.invalidateQueries({ queryKey: ['messages'] });

        setOpen(false);
      } else if (event.type === 'knowledge.extraction_failed') {
        setProgress((prev) => ({
          ...prev,
          status: 'failed',
          error: event.data?.error || tAtoms('extraction.errors.unknown'),
        }));
        setExtracting(false);
        setCancelling(false);
        toast.error(tAtoms('extraction.notifications.failed', { error: event.data?.error || tAtoms('extraction.errors.unknown') }));
      } else if (event.type === 'knowledge.extraction_cancelling') {
        setProgress((prev) => ({ ...prev, status: 'cancelling' }));
        setCancelling(true);
      } else if (event.type === 'knowledge.extraction_cancelled') {
        setProgress((prev) => ({
          ...prev,
          status: 'cancelled',
          topics_created: event.data?.topics_created ?? prev.topics_created,
          atoms_created: event.data?.atoms_created ?? prev.atoms_created,
          versions_created: event.data?.versions_created ?? prev.versions_created,
        }));
        setExtracting(false);
        setCancelling(false);
        setExtractionId(null);
        toast.success(t('sheet.notifications.cancelled'));

        // Invalidate related queries to show partial results
        queryClient.invalidateQueries({ queryKey: ['topics'] });
        queryClient.invalidateQueries({ queryKey: ['atoms'] });
        queryClient.invalidateQueries({ queryKey: ['messages'] });
      }
    },
  });

  const detectPeriodType = (start: string, end: string): PeriodType => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

    if (Math.abs(diffHours - 24) < 1) return 'last_24h';
    if (Math.abs(diffHours - 24 * 7) < 2) return 'last_7d';
    if (Math.abs(diffHours - 24 * 30) < 2) return 'last_30d';
    return 'custom';
  };

  const handleExtract = async () => {
    if (!agentConfigId) {
      toast.error(tAtoms('extraction.errors.selectAgent'));
      return;
    }

    if (!timeWindow.start || !timeWindow.end) {
      toast.error(tAtoms('extraction.errors.selectTimeWindow'));
      return;
    }

    setExtracting(true);
    setProgress({
      status: 'running',
      topics_created: 0,
      atoms_created: 0,
      versions_created: 0,
    });

    try {
      const periodType = detectPeriodType(timeWindow.start, timeWindow.end);
      const periodRequest: PeriodRequest = {
        period_type: periodType,
        ...(periodType === 'custom' && {
          start_date: new Date(timeWindow.start).toISOString(),
          end_date: new Date(timeWindow.end).toISOString(),
        }),
      };

      const response = await knowledgeService.triggerExtractionByPeriod(periodRequest, agentConfigId);
      setExtractionId(response.extraction_id);
    } catch (error) {
      console.error('Failed to trigger extraction:', error);
      setExtracting(false);
      setProgress((prev) => ({
        ...prev,
        status: 'failed',
        error: error instanceof Error ? error.message : tAtoms('extraction.errors.startFailed'),
      }));
      toast.error(error instanceof Error ? error.message : tAtoms('extraction.errors.startFailed'));
    }
  };

  const handleCancel = useCallback(async () => {
    if (!extractionId || cancelling) return;

    setCancelling(true);
    toast.info(t('sheet.notifications.cancelRequested'));

    try {
      await knowledgeService.cancelExtraction(extractionId);
      // WebSocket events will handle the state updates
    } catch (error) {
      console.error('Failed to cancel extraction:', error);
      setCancelling(false);
      toast.error(t('sheet.notifications.cancelFailed'));
    }
  }, [extractionId, cancelling, t]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="h-8 gap-2"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">{t('sheet.startExtraction')}</span>
        </Button>
      </SheetTrigger>

      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t('sheet.title')}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Time Period Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('sheet.timePeriod')}</label>
            <TimeWindowSelector
              value={timeWindow}
              onChange={({ start, end }) => {
                setTimeWindow({ start, end });
              }}
            />
          </div>

          {/* Agent Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('sheet.aiProvider')}</label>
            <Select value={agentConfigId} onValueChange={setAgentConfigId} disabled={agentConfigsLoading}>
              <SelectTrigger>
                <SelectValue placeholder={agentConfigsLoading ? tAtoms('extraction.loadingAgents') : t('sheet.selectProviderPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {agentConfigs.length === 0 && !agentConfigsLoading ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    {tAtoms('extraction.noActiveAgents')}
                  </div>
                ) : (
                  agentConfigs.map((config) => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleExtract}
              disabled={!agentConfigId || extracting || !timeWindow.start}
              className="flex-1"
            >
              {extracting && !cancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('sheet.extracting')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('sheet.startExtraction')}
                </>
              )}
            </Button>

            {/* Cancel Button - visible during running/cancelling */}
            {(progress.status === 'running' || progress.status === 'cancelling') && extractionId && (
              <Button
                onClick={handleCancel}
                disabled={cancelling || progress.status === 'cancelling'}
                variant="destructive"
                className="h-11 min-w-[44px]"
                aria-label={t('sheet.cancel')}
              >
                {cancelling || progress.status === 'cancelling' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline">
                  {cancelling || progress.status === 'cancelling'
                    ? t('sheet.cancelling')
                    : t('sheet.cancel')}
                </span>
              </Button>
            )}
          </div>

          {/* Progress Indicator */}
          {progress.status !== 'idle' && (
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>{tAtoms('extraction.progress')}</span>
                <span className="text-muted-foreground">
                  {progress.status === 'running'
                    ? tAtoms('extraction.processing')
                    : progress.status === 'completed'
                      ? tAtoms('extraction.complete')
                      : progress.status === 'cancelling'
                        ? t('sheet.cancelling')
                        : progress.status === 'cancelled'
                          ? t('sheet.cancelled')
                          : tAtoms('extraction.failed')}
                </span>
              </div>

              {(progress.status === 'running' || progress.status === 'cancelling') && (
                <Progress value={undefined} className="w-full" />
              )}

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-semantic-info/10 rounded">
                  <div className="text-2xl font-bold text-semantic-info">
                    {progress.topics_created}
                  </div>
                  <div className="text-xs text-muted-foreground">{tAtoms('extraction.topics')}</div>
                </div>
                <div className="p-2 bg-semantic-success/10 rounded">
                  <div className="text-2xl font-bold text-semantic-success">
                    {progress.atoms_created}
                  </div>
                  <div className="text-xs text-muted-foreground">{tAtoms('extraction.atoms')}</div>
                </div>
                <div className="p-2 bg-semantic-warning/10 rounded">
                  <div className="text-2xl font-bold text-semantic-warning">
                    {progress.versions_created}
                  </div>
                  <div className="text-xs text-muted-foreground">{tAtoms('extraction.versions')}</div>
                </div>
              </div>

              {progress.error && (
                <div className="p-4 bg-semantic-error/10 text-semantic-error text-sm rounded">
                  {progress.error}
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
