import { useQuery } from '@tanstack/react-query';
import { agentService } from '@/features/agents/api/agentService';

export function useAgentStats(agentId: string) {
    return useQuery({
        queryKey: ['agent-stats', agentId],
        queryFn: () => agentService.getAgentStats(agentId),
        refetchInterval: 30000, // Refresh every 30 seconds
        staleTime: 10000,
    });
}
