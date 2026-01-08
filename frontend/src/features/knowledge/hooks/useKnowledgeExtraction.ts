import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useWebSocket } from '@/shared/hooks';
import { isKnowledgeEvent, type KnowledgeEvent } from '@/shared/types/websocket';
import { toast } from 'sonner';
import { knowledgeService } from '../api/knowledgeService';
import type { ExtractionProgress, PeriodType, PeriodRequest } from '../types';

interface UseKnowledgeExtractionOptions {
    onComplete?: () => void;
    agentConfigId?: string;
    topicId?: string;
}

export function useKnowledgeExtraction({
    onComplete,
    agentConfigId,
    topicId
}: UseKnowledgeExtractionOptions = {}) {
    const { t } = useTranslation('atoms');
    const [extracting, setExtracting] = useState(false);
    const [progress, setProgress] = useState<ExtractionProgress>({
        status: 'idle',
        topics_created: 0,
        atoms_created: 0,
        versions_created: 0,
    });

    useWebSocket({
        topics: ['knowledge'],
        onMessage: (data: unknown) => {
            if (!isKnowledgeEvent(data as KnowledgeEvent)) return;

            const event = data as KnowledgeEvent;

            if (event.type === 'knowledge.extraction_started') {
                // If we have an extraction ID we could filter here, but for now global events
                setProgress((prev) => ({ ...prev, status: 'running' }));
                toast.info(t('extraction.notifications.started', { count: event.data?.message_count || 0 }));
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

                toast.success(
                    t('extraction.notifications.completed', { atoms: atomsCreated, versions: versionsCreated }),
                    {
                        duration: 5000,
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

    const extractByPeriod = useCallback(async (
        start: string,
        end: string,
        filterByTopic: boolean
    ) => {
        if (!agentConfigId) {
            toast.error(t('extraction.errors.selectAgent'));
            return;
        }

        if (!start || !end) {
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
            // Simple period detection logic
            const startDate = new Date(start);
            const endDate = new Date(end);
            const diffHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

            let periodType: PeriodType = 'custom';
            if (Math.abs(diffHours - 24) < 1) periodType = 'last_24h';
            else if (Math.abs(diffHours - 24 * 7) < 2) periodType = 'last_7d';
            else if (Math.abs(diffHours - 24 * 30) < 2) periodType = 'last_30d';

            const periodRequest: PeriodRequest = {
                period_type: periodType,
                ...(periodType === 'custom' && {
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
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
    }, [agentConfigId, topicId, t]);

    const extractByMessages = useCallback(async (
        messageIds: string[],
        agentConfigIdOverride?: string,
        options?: { includeContext?: boolean, contextWindow?: number }
    ) => {
        const activeAgentId = agentConfigIdOverride || agentConfigId;

        if (!activeAgentId) {
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
            await knowledgeService.triggerExtractionByMessages(
                messageIds,
                activeAgentId,
                options?.includeContext,
                options?.contextWindow
            );
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
    }, [agentConfigId, t]);

    return {
        extracting,
        progress,
        extractByPeriod,
        extractByMessages,
        setExtracting, // Exposed in case we need to manually reset
        setProgress     // Exposed in case we need to manually update
    };
}
