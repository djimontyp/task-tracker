import { useState, useEffect } from 'react';
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
import { SparklesIcon } from '@heroicons/react/24/outline';
import { TimeWindowSelector } from '@/features/analysis/components/TimeWindowSelector';
import { knowledgeService } from '../api/knowledgeService';
import { useWebSocket } from '@/features/websocket/hooks/useWebSocket';
import { agentService } from '@/features/agents/api/agentService';
import type { AgentConfig } from '@/features/agents/types/agent';
import type { ExtractionProgress, PeriodType, PeriodRequest } from '../types';
import { toast } from 'sonner';

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
        toast.error('Failed to load agent configurations');
      } finally {
        setAgentConfigsLoading(false);
      }
    };

    fetchAgentConfigs();
  }, []);

  useWebSocket({
    topics: ['knowledge'],
    onMessage: (data: any) => {
      if (!data?.type) return;

      if (data.type === 'knowledge.extraction_started') {
        setProgress((prev) => ({ ...prev, status: 'running' }));
        toast.success(`Knowledge extraction started for ${data.data?.message_count || 0} messages`);
      } else if (data.type === 'knowledge.topic_created') {
        setProgress((prev) => ({
          ...prev,
          topics_created: prev.topics_created + 1,
        }));
      } else if (data.type === 'knowledge.atom_created') {
        setProgress((prev) => ({
          ...prev,
          atoms_created: prev.atoms_created + 1,
        }));
      } else if (data.type === 'knowledge.version_created') {
        setProgress((prev) => ({
          ...prev,
          versions_created: prev.versions_created + 1,
        }));
      } else if (data.type === 'knowledge.extraction_completed') {
        setProgress((prev) => ({ ...prev, status: 'completed' }));
        setExtracting(false);
        const stats = data.data || {};
        toast.success(
          `Extraction completed! Created ${stats.topics_created || 0} topics, ${stats.atoms_created || 0} atoms, ${stats.versions_created || 0} versions`
        );
        onComplete?.();
      } else if (data.type === 'knowledge.extraction_failed') {
        setProgress((prev) => ({
          ...prev,
          status: 'failed',
          error: data.data?.error || 'Unknown error',
        }));
        setExtracting(false);
        toast.error(`Extraction failed: ${data.data?.error || 'Unknown error'}`);
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
      toast.error('Please select an AI agent');
      return;
    }

    if (!timeWindow.start || !timeWindow.end) {
      toast.error('Please select a time window');
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
        error: error instanceof Error ? error.message : 'Failed to start extraction',
      }));
      toast.error(error instanceof Error ? error.message : 'Failed to start extraction');
    }
  };

  const handleExtractByMessages = async () => {
    if (!agentConfigId) {
      toast.error('Please select an AI agent');
      return;
    }

    if (!messageIds || messageIds.length === 0) {
      toast.error('No messages available for extraction');
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
        error: error instanceof Error ? error.message : 'Failed to start extraction',
      }));
      toast.error(error instanceof Error ? error.message : 'Failed to start extraction');
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
        <CardTitle>Extract Knowledge from Messages</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs value={tabMode} onValueChange={(value) => setTabMode(value as 'period' | 'messages')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="period">By Period</TabsTrigger>
            <TabsTrigger value="messages" disabled={!messageIds || messageIds.length === 0}>
              By Messages ({messageIds?.length || 0})
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
                  aria-label="Filter by current topic"
                />
                <Label
                  htmlFor="filter-topic"
                  className="text-sm font-normal cursor-pointer select-none"
                >
                  Extract only from current topic
                </Label>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              {filterByTopic && topicId
                ? `Will analyze messages from this topic within the selected period`
                : `Will analyze all unprocessed messages within the selected period`}
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground">
              {messageIds && messageIds.length > 0
                ? `Ready to extract knowledge from ${messageIds.length} selected message${messageIds.length > 1 ? 's' : ''}`
                : 'No messages available for extraction'}
            </div>
          </TabsContent>
        </Tabs>

        <div>
          <label className="text-sm font-medium mb-2 block">Select AI Agent</label>
          <Select value={agentConfigId} onValueChange={setAgentConfigId} disabled={agentConfigsLoading}>
            <SelectTrigger>
              <SelectValue placeholder={agentConfigsLoading ? "Loading agents..." : "Choose agent configuration"} />
            </SelectTrigger>
            <SelectContent>
              {agentConfigs.length === 0 && !agentConfigsLoading ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No active agents available. Please create one in the Agents page.
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
          <SparklesIcon className="h-4 w-4 mr-2" />
          {extracting ? 'Extracting...' : 'Extract Knowledge'}
        </Button>

        {progress.status !== 'idle' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="text-gray-500">
                {progress.status === 'running'
                  ? 'Processing...'
                  : progress.status === 'completed'
                    ? 'Complete'
                    : 'Failed'}
              </span>
            </div>

            {progress.status === 'running' && <Progress value={undefined} className="w-full" />}

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {progress.topics_created}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Topics</div>
              </div>
              <div className="p-2 bg-green-50 dark:bg-green-950 rounded">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {progress.atoms_created}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Atoms</div>
              </div>
              <div className="p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {progress.versions_created}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Versions</div>
              </div>
            </div>

            {progress.error && (
              <div className="p-3 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 text-sm rounded">
                {progress.error}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
