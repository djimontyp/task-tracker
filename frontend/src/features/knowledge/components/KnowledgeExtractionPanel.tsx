import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Label,
  Checkbox,
} from '@/shared/ui';
import { Sparkles } from 'lucide-react';
import { TimeWindowSelector } from '@/features/analysis/components/TimeWindowSelector';
import { knowledgeService } from '../api/knowledgeService';
import { useWebSocket } from '@/shared/hooks';
import { agentService } from '@/features/agents/api/agentService';
import type { AgentConfig } from '@/features/agents/types/agent';
import type { ExtractionProgress, PeriodType, PeriodRequest } from '../types';
import { toast } from 'sonner';
import { isKnowledgeEvent, type KnowledgeEvent } from '@/shared/types/websocket';

interface KnowledgeExtractionPanelProps {
  messageIds?: number[];
  topicId?: string;
  onComplete?: () => void;
}

export function KnowledgeExtractionPanel({
  messageIds,
  topicId,
  onComplete,
}: KnowledgeExtractionPanelProps) {
  const { t } = useTranslation('atoms');
  const navigate = useNavigate();
  const [agentConfigs, setAgentConfigs] = useState<AgentConfig[]>([]);
  const [agentConfigsLoading, setAgentConfigsLoading] = useState(true);
  const [agentConfigId, setAgentConfigId] = useState<string>('');
  const [extracting, setExtracting] = useState(false);
  const [tabMode, setTabMode] = useState<'period' | 'messages'>('period');
  const [timeWindow, setTimeWindow] = useState({ start: '', end: '' });
  const [filterByTopic, setFilterByTopic] = useState(!!topicId);
  const [progress, setProgress] = useState<ExtractionProgress>({
    status: 'idle',
    topics_created: 0,
    atoms_created: 0,
    versions_created: 0,
  });

  useEffect(() => {
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
        toast.error(t('extraction.errors.loadAgents'));
      } finally {
        setAgentConfigsLoading(false);
      }
    };

    fetchAgentConfigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useWebSocket({
    topics: ['knowledge'],
    onMessage: (data: unknown) => {
      if (!isKnowledgeEvent(data as KnowledgeEvent)) return;

      const event = data as KnowledgeEvent;

      if (event.type === 'knowledge.extraction_started') {
        setProgress((prev) => ({ ...prev, status: 'running' }));
        toast.success(t('extraction.notifications.started', { count: event.data?.message_count || 0 }));
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

        // Enhanced notification with CTA to review versions
        const versionsCreated = stats.versions_created || 0;
        const atomsCreated = stats.atoms_created || 0;
        const topicsCreated = stats.topics_created || 0;

        toast.success(
          t('extraction.notifications.completed', { atoms: atomsCreated, versions: versionsCreated }),
          {
            duration: 8000,
            action: versionsCreated > 0 ? {
              label: t('extraction.notifications.reviewNow'),
              onClick: () => navigate('/versions?status=pending')
            } : undefined,
            description: topicsCreated > 0 ? t('extraction.notifications.topicsIdentified', { count: topicsCreated }) : undefined,
          }
        );
        onComplete?.();
      } else if (event.type === 'knowledge.extraction_failed') {
        setProgress((prev) => ({
          ...prev,
          status: 'failed',
          error: event.data?.error || t('extraction.errors.unknown'),
        }));
        setExtracting(false);
        toast.error(t('extraction.notifications.failed', { error: event.data?.error || t('extraction.errors.unknown') }));
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

  const handleExtractByPeriod = async () => {
    if (!agentConfigId) {
      toast.error(t('extraction.errors.selectAgent'));
      return;
    }

    if (!timeWindow.start || !timeWindow.end) {
      toast.error(t('extraction.errors.selectTimeWindow'));
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
        ...(filterByTopic && topicId && { topic_id: topicId }),
      };

      await knowledgeService.triggerExtractionByPeriod(periodRequest, agentConfigId);
    } catch (error) {
      console.error('Failed to trigger extraction:', error);
      setExtracting(false);
      setProgress((prev) => ({
        ...prev,
        status: 'failed',
        error: error instanceof Error ? error.message : t('extraction.errors.startFailed'),
      }));
      toast.error(error instanceof Error ? error.message : t('extraction.errors.startFailed'));
    }
  };

  const handleExtractByMessages = async () => {
    if (!agentConfigId) {
      toast.error(t('extraction.errors.selectAgent'));
      return;
    }

    if (!messageIds || messageIds.length === 0) {
      toast.error(t('extraction.errors.noMessages'));
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
      await knowledgeService.triggerExtractionByMessages(messageIds, agentConfigId);
    } catch (error) {
      console.error('Failed to trigger extraction:', error);
      setExtracting(false);
      setProgress((prev) => ({
        ...prev,
        status: 'failed',
        error: error instanceof Error ? error.message : t('extraction.errors.startFailed'),
      }));
      toast.error(error instanceof Error ? error.message : t('extraction.errors.startFailed'));
    }
  };

  const handleExtract = () => {
    if (tabMode === 'period') {
      handleExtractByPeriod();
    } else {
      handleExtractByMessages();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('extraction.title')}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs value={tabMode} onValueChange={(value) => setTabMode(value as 'period' | 'messages')}>
          <TabsList variant="pill" className="grid w-full grid-cols-2">
            <TabsTrigger variant="pill" value="period">{t('extraction.byPeriod')}</TabsTrigger>
            <TabsTrigger variant="pill" value="messages" disabled={!messageIds || messageIds.length === 0}>
              {t('extraction.byMessages', { count: messageIds?.length || 0 })}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="period" className="space-y-4 mt-4">
            <TimeWindowSelector
              value={timeWindow}
              onChange={({ start, end }) => {
                setTimeWindow({ start, end });
              }}
            />

            {topicId && (
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="filter-topic"
                  checked={filterByTopic}
                  onCheckedChange={(checked) => setFilterByTopic(checked === true)}
                  aria-label={t('extraction.filterByTopicAriaLabel')}
                />
                <Label
                  htmlFor="filter-topic"
                  className="text-sm font-normal cursor-pointer select-none"
                >
                  {t('extraction.filterByTopic')}
                </Label>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              {filterByTopic && topicId
                ? t('extraction.willAnalyzeFromTopic')
                : t('extraction.willAnalyzeAll')}
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground">
              {messageIds && messageIds.length > 0
                ? t('extraction.readyToExtract', { count: messageIds.length })
                : t('extraction.noMessagesAvailable')}
            </div>
          </TabsContent>
        </Tabs>

        <div>
          <label className="text-sm font-medium mb-2 block">{t('extraction.selectAgent')}</label>
          <Select value={agentConfigId} onValueChange={setAgentConfigId} disabled={agentConfigsLoading}>
            <SelectTrigger>
              <SelectValue placeholder={agentConfigsLoading ? t('extraction.loadingAgents') : t('extraction.chooseAgent')} />
            </SelectTrigger>
            <SelectContent>
              {agentConfigs.length === 0 && !agentConfigsLoading ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  {t('extraction.noActiveAgents')}
                </div>
              ) : (
                agentConfigs.map((config) => (
                  <SelectItem key={config.id} value={config.id}>
                    {config.name}
                    {config.description && (
                      <span className="text-muted-foreground ml-2">- {config.description}</span>
                    )}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleExtract} disabled={!agentConfigId || extracting} className="w-full">
          <Sparkles className="h-4 w-4 mr-2" />
          {extracting ? t('extraction.extracting') : t('extraction.extractKnowledge')}
        </Button>

        {progress.status !== 'idle' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t('extraction.progress')}</span>
              <span className="text-muted-foreground">
                {progress.status === 'running'
                  ? t('extraction.processing')
                  : progress.status === 'completed'
                    ? t('extraction.complete')
                    : t('extraction.failed')}
              </span>
            </div>

            {progress.status === 'running' && <Progress value={undefined} className="w-full" />}

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-semantic-info/10 rounded">
                <div className="text-2xl font-bold text-semantic-info">
                  {progress.topics_created}
                </div>
                <div className="text-xs text-muted-foreground">{t('extraction.topics')}</div>
              </div>
              <div className="p-2 bg-semantic-success/10 rounded">
                <div className="text-2xl font-bold text-semantic-success">
                  {progress.atoms_created}
                </div>
                <div className="text-xs text-muted-foreground">{t('extraction.atoms')}</div>
              </div>
              <div className="p-2 bg-semantic-warning/10 rounded">
                <div className="text-2xl font-bold text-semantic-warning">
                  {progress.versions_created}
                </div>
                <div className="text-xs text-muted-foreground">{t('extraction.versions')}</div>
              </div>
            </div>

            {progress.error && (
              <div className="p-4 bg-semantic-error/10 text-semantic-error text-sm rounded">
                {progress.error}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
