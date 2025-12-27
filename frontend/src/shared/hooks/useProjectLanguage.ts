import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/features/projects/api/projectService';

const DEFAULT_PROJECT_LANGUAGE = 'uk';

/**
 * Hook to get the active project's language setting.
 *
 * Used for:
 * - Language mismatch warnings when AI-generated content differs from project language
 * - Ensuring AI outputs in the correct language
 *
 * @returns Project language code (ISO 639-1: 'uk' | 'en') and loading state
 */
export function useProjectLanguage() {
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects', 'active'],
    queryFn: async () => {
      const response = await projectService.listProjects();
      // Get the first active project (single-project architecture)
      return response.items.find((p) => p.is_active) ?? response.items[0];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - project settings rarely change
  });

  return {
    projectLanguage: projectsData?.language ?? DEFAULT_PROJECT_LANGUAGE,
    isLoading,
    hasProject: !!projectsData,
  };
}
