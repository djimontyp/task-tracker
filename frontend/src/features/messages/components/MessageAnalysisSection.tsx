import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Play, CheckCircle2 } from 'lucide-react';
import { Button, Progress, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '@/shared/ui';
import { useKnowledgeExtraction } from '@/features/knowledge/hooks/useKnowledgeExtraction';
import { agentService } from '@/features/agents/api/agentService';

interface MessageAnalysisSectionProps {
    message: { id: string | number };
    hasAnalysis: boolean;
    reasoning?: string;
}

export function MessageAnalysisSection({ message, hasAnalysis, reasoning }: MessageAnalysisSectionProps) {
    const { t } = useTranslation('messages');
    const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>();
    const [includeContext, setIncludeContext] = useState(false);

    // Fetch active agents using TanStack Query
    const { data: agents = [], isLoading: loading } = useQuery({
        queryKey: ['agents', 'active'],
        queryFn: () => agentService.listAgents({ active_only: true }),
        staleTime: 5 * 60 * 1000, // 5 minutes - agent configs rarely change
    });

    // Set default agent when agents are loaded
    useEffect(() => {
        if (agents.length > 0 && !selectedAgentId) {
            // Prefer 'knowledge_extractor' if available, otherwise first one
            const defaultAgent = agents.find(a => a.name === 'knowledge_extractor') || agents[0];
            setSelectedAgentId(defaultAgent.id);
        }
    }, [agents, selectedAgentId]);

    const {
        extracting,
        progress,
        extractByMessages
    } = useKnowledgeExtraction({
        agentConfigId: selectedAgentId,
        onComplete: () => {
            // Logic handled by hook/websocket
        }
    });

    const handleExtract = () => {
        if (selectedAgentId) {
            extractByMessages(
                [String(message.id)],
                selectedAgentId,
                { includeContext }
            );
        }
    };

    const isIdle = !extracting && progress.status === 'idle';
    const isRunning = extracting || progress.status === 'running';
    const isCompleted = progress.status === 'completed';

    return (
        <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                {t('analysis.title')}
            </h3>

            {/* IDLE STATE */}
            {isIdle && (
                <div className="bg-gradient-to-br from-primary/5 via-primary/5 to-transparent rounded-lg p-4 border border-primary/20 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />

                    <div className="flex flex-col gap-3 relative z-dropdown">
                        {hasAnalysis ? (
                            <p className="text-sm text-foreground/90 leading-relaxed italic">
                                &quot;{reasoning || 'No specific reasoning provided'}&quot;
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                {t('analysis.ready_to_extract', 'Ready to extract knowledge from this message.')}
                            </p>
                        )}

                        <div className="flex flex-col gap-2 mt-1">
                            {/* Agent & Context Controls */}
                            <div className="flex items-center gap-2">
                                <Select value={selectedAgentId} onValueChange={setSelectedAgentId} disabled={loading}>
                                    <SelectTrigger className="h-8 text-xs bg-background/50 border-input/60 w-[140px]">
                                        <SelectValue placeholder={t('analysis.selectAgent')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {agents.map(agent => (
                                            <SelectItem key={agent.id} value={agent.id} className="text-xs">
                                                {agent.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="flex items-center gap-2 px-2 py-1 rounded bg-background/30 border border-border/30">
                                    <span className="text-[10px] text-muted-foreground font-medium">{t('analysis.context')}</span>
                                    <Switch
                                        checked={includeContext}
                                        onCheckedChange={setIncludeContext}
                                        className="scale-75 data-[state=checked]:bg-primary"
                                    />
                                </div>
                            </div>

                            <Button
                                size="sm"
                                onClick={handleExtract}
                                disabled={!selectedAgentId || loading}
                                className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 shadow-none h-8"
                            >
                                <Play className="w-3.5 h-3.5 mr-2 fill-current" />
                                {t('actions.extract', 'Extract')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* RUNNING STATE */}
            {isRunning && (
                <div className="bg-background/50 rounded-lg p-4 border border-border/40 space-y-3">
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                        <span>{t('analysis.processing')}</span>
                        <span className="animate-pulse text-primary">{t('analysis.running', { count: progress.topics_created + progress.atoms_created })}</span>
                    </div>
                    <Progress value={undefined} className="h-1.5" />

                    <div className="space-y-1 pt-2">
                        <LogItem active={progress.topics_created === 0} completed={progress.topics_created > 0}>
                            {t('analysis.identifyingTopics')}
                        </LogItem>
                        <LogItem active={progress.topics_created > 0 && progress.atoms_created === 0} completed={progress.atoms_created > 0}>
                            {t('analysis.extractingAtoms')}
                        </LogItem>
                        <LogItem active={progress.atoms_created > 0} completed={progress.versions_created > 0}>
                            {t('analysis.finalizing')}
                        </LogItem>
                    </div>
                </div>
            )}

            {/* COMPLETED/RESULT STATE */}
            {isCompleted && (
                <div className="bg-semantic-success/5 rounded-lg p-4 border border-semantic-success/20 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2 text-semantic-success font-medium text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        {t('analysis.completed')}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-center">
                        <div className="p-2 bg-background/50 rounded border border-border/40">
                            <div className="font-bold text-lg">{progress.topics_created}</div>
                            <div className="text-muted-foreground">{t('analysis.topics')}</div>
                        </div>
                        <div className="p-2 bg-background/50 rounded border border-border/40">
                            <div className="font-bold text-lg">{progress.atoms_created}</div>
                            <div className="text-muted-foreground">{t('analysis.atoms')}</div>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleExtract}
                        className="w-full text-xs text-muted-foreground hover:text-foreground h-7"
                    >
                        {t('analysis.rerun')}
                    </Button>
                </div>
            )}
        </div>
    );
}

function LogItem({ children, active, completed }: { children: React.ReactNode, active: boolean, completed: boolean }) {
    return (
        <div className={`flex items-center gap-2 text-xs ${active ? 'text-primary font-medium' : completed ? 'text-muted-foreground' : 'text-muted-foreground/30'}`}>
            {completed ? (
                <CheckCircle2 className="w-3 h-3 text-semantic-success shrink-0" />
            ) : active ? (
                <div className="w-3 h-3 rounded-full border-2 border-primary border-r-transparent animate-spin shrink-0" />
            ) : (
                <div className="w-3 h-3 rounded-full border border-border shrink-0" />
            )}
            {children}
        </div>
    )
}
