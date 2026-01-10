/**
 * Hook for loading and selecting agent configurations
 *
 * Extracts common agent loading logic from MessageAnalysisSection and KnowledgeExtractionPanel
 */

import { useState, useEffect } from 'react';
import { agentService } from '@/features/agents/api/agentService';
import type { AgentConfig } from '@/features/agents/types/agent';

interface UseAgentConfigsOptions {
  /** Preferred agent name to auto-select if available */
  preferredAgentName?: string;
}

interface UseAgentConfigsReturn {
  /** List of loaded agent configs */
  configs: AgentConfig[];
  /** Loading state */
  loading: boolean;
  /** Currently selected agent ID */
  selectedId: string | undefined;
  /** Update selected agent ID */
  setSelectedId: (id: string | undefined) => void;
}

/**
 * Load active agent configurations and manage selection state.
 *
 * Auto-selects the first agent by default, or a preferred agent if specified.
 *
 * @example
 * ```tsx
 * const { configs, loading, selectedId, setSelectedId } = useAgentConfigs();
 *
 * // With preferred agent
 * const { configs, loading, selectedId, setSelectedId } = useAgentConfigs({
 *   preferredAgentName: 'knowledge_extractor'
 * });
 * ```
 */
export function useAgentConfigs(options: UseAgentConfigsOptions = {}): UseAgentConfigsReturn {
  const { preferredAgentName } = options;

  const [configs, setConfigs] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  useEffect(() => {
    let isMounted = true;

    const fetchConfigs = async () => {
      setLoading(true);
      try {
        const data = await agentService.listAgents({ active_only: true });

        if (!isMounted) return;

        setConfigs(data);

        // Auto-select first agent or preferred agent if available
        if (data.length > 0) {
          const preferredAgent = preferredAgentName
            ? data.find((a) => a.name === preferredAgentName)
            : undefined;
          const defaultAgent = preferredAgent || data[0];
          setSelectedId(defaultAgent.id);
        }
      } catch (error) {
        console.error('Failed to fetch agent configs:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchConfigs();

    return () => {
      isMounted = false;
    };
  }, [preferredAgentName]);

  return {
    configs,
    loading,
    selectedId,
    setSelectedId,
  };
}
