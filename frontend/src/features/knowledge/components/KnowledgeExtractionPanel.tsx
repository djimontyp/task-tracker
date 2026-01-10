import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Label,
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
} from '@/shared/ui';
import { Sparkles } from 'lucide-react';
import { TimeWindowSelector } from '@/features/analysis/components/TimeWindowSelector';
import { useKnowledgeExtraction } from '@/features/knowledge/hooks/useKnowledgeExtraction';
import { agentService } from '@/features/agents/api/agentService';
import type { AgentConfig } from '@/features/agents/types/agent';
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
  const { t } = useTranslation('atoms');
  const [agentConfigs, setAgentConfigs] = useState<AgentConfig[]>([]);
  const [agentConfigsLoading, setAgentConfigsLoading] = useState(true);
  const [agentConfigId, setAgentConfigId] = useState<string>('');
  const [tabMode, setTabMode] = useState<'period' | 'messages'>('period');
  const [timeWindow, setTimeWindow] = useState({ start: '', end: '' });
  const [filterByTopic, setFilterByTopic] = useState(!!topicId);

  const {
    extracting,
    progress,
    extractByPeriod,
    extractByMessages
  } = useKnowledgeExtraction({
    onComplete,
    agentConfigId,
    topicId: filterByTopic ? topicId : undefined
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

  const handleExtractByPeriod = () => {
    extractByPeriod(timeWindow.start, timeWindow.end, filterByTopic);
  };

  const handleExtractByMessages = () => {
    if (messageIds) {
      extractByMessages(messageIds.map(String));
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
