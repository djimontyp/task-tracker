import React, { useMemo } from 'react'
import { Sparkles, Brain, ArrowRight } from 'lucide-react'
import { Button } from '@/shared/ui'
import { Message } from '@/features/messages/types'
import { useKnowledgeExtraction } from '@/features/knowledge/hooks/useKnowledgeExtraction'
import { agentService } from '@/features/agents/api/agentService'
import { toast } from 'sonner'

interface SmartBatchBannerProps {
    messages: Message[]
}

export const SmartBatchBanner: React.FC<SmartBatchBannerProps> = ({ messages }) => {
    // 1. Identify "Oil" (High signal, no topics)
    const potentialInsights = useMemo(() => {
        return messages.filter(m =>
            m.noise_classification === 'signal' &&
            (m.importance_score || 0) >= 80 && // Only high importance
            !m.topic_name // Not yet harvested
        )
    }, [messages])

    const { extractByMessages, extracting } = useKnowledgeExtraction()

    if (potentialInsights.length === 0) return null

    const handleBatchExtract = async () => {
        try {
            // Get default agent
            const agents = await agentService.listAgents({ active_only: true })
            const agent = agents.find(a => a.name === 'knowledge_extractor') || agents[0]

            if (!agent) {
                toast.error("No active agent found")
                return
            }

            await extractByMessages(
                potentialInsights.map(m => String(m.id)),
                agent.id,
                { includeContext: true, contextWindow: 3 } // Batch context might be smaller
            )

            toast.success("Batch extraction started")
        } catch (e) {
            console.error(e)
        }
    }

    if (extracting) {
        return (
            <div className="mb-4 p-3 rounded-lg border border-primary/20 bg-primary/5 flex items-center gap-3 animate-pulse">
                <Brain className="h-4 w-4 text-primary animate-spin" />
                <span className="text-sm font-medium text-primary">
                    Extracting knowledge from {potentialInsights.length} messages...
                </span>
            </div>
        )
    }

    return (
        <div className="mb-4 p-1 rounded-lg bg-gradient-to-r from-primary/10 via-background to-background border border-primary/20 relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/50" />

            <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
                            {potentialInsights.length} potential insights detected
                            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                        </span>
                        <span className="text-xs text-muted-foreground">
                            High-signal messages waiting to be turned into knowledge.
                        </span>
                    </div>
                </div>

                <Button
                    size="sm"
                    onClick={handleBatchExtract}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm gap-2 text-xs h-8"
                >
                    Capture Knowledge
                    <ArrowRight className="h-3 w-3 opacity-70" />
                </Button>
            </div>
        </div>
    )
}
