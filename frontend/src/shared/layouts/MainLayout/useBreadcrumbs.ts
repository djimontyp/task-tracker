import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { topicService } from '@/features/topics/api/topicService'
import type { Topic } from '@/features/topics/types'

export interface BreadcrumbSegment {
  label: string
  href?: string
}

const breadcrumbMap: Record<string, BreadcrumbSegment[]> = {
  '/': [
    { label: 'Dashboard' },
  ],
  '/messages': [
    { label: 'Messages' },
  ],
  '/topics': [
    { label: 'Topics' },
  ],
  '/tasks': [
    { label: 'Tasks' },
  ],
  '/analysis': [
    { label: 'Analysis Runs' },
  ],
  '/proposals': [
    { label: 'Task Proposals' },
  ],
  '/noise-filtering': [
    { label: 'Noise Filtering' },
  ],
  '/versions': [
    { label: 'Versions' },
  ],
  '/agents': [
    { label: 'Agents' },
  ],
  '/agent-tasks': [
    { label: 'Task Templates' },
  ],
  '/providers': [
    { label: 'Providers' },
  ],
  '/projects': [
    { label: 'Projects' },
  ],
  '/automation/dashboard': [
    { label: 'Automation', href: '/automation/dashboard' },
    { label: 'Overview' },
  ],
  '/automation/rules': [
    { label: 'Automation', href: '/automation/dashboard' },
    { label: 'Rules' },
  ],
  '/automation/scheduler': [
    { label: 'Automation', href: '/automation/dashboard' },
    { label: 'Scheduler' },
  ],
  '/automation/notifications': [
    { label: 'Automation', href: '/automation/dashboard' },
    { label: 'Notifications' },
  ],
  '/analytics': [
    { label: 'Analytics' },
  ],
  '/monitoring': [
    { label: 'Task Monitoring' },
  ],
  '/settings': [
    { label: 'Settings' },
  ],
}

export function useBreadcrumbs(pathname: string): BreadcrumbSegment[] {
  const queryClient = useQueryClient()
  const topicDetailMatch = pathname.match(/^\/topics\/(\d+)$/)
  const topicIdFromUrl = topicDetailMatch ? parseInt(topicDetailMatch[1], 10) : null

  const { data: topicData } = useQuery<Topic>({
    queryKey: ['topic', topicIdFromUrl],
    queryFn: () => topicService.getTopicById(topicIdFromUrl!),
    enabled: topicIdFromUrl !== null,
    staleTime: 5 * 60 * 1000,
    initialData: () => {
      if (topicIdFromUrl === null) return undefined
      return queryClient.getQueryData<Topic>(['topic', topicIdFromUrl])
    },
  })

  const crumbs = useMemo((): BreadcrumbSegment[] => {
    if (topicDetailMatch && topicIdFromUrl) {
      return [
        { label: 'Topics', href: '/topics' },
        { label: topicData?.name || 'Topic' },
      ]
    }

    const segments = breadcrumbMap[pathname]

    if (!segments) {
      return pathname
        .split('/')
        .filter(Boolean)
        .map((segment) => ({
          label: segment.charAt(0).toUpperCase() + segment.replace(/-/g, ' ').slice(1),
        }))
    }

    return segments
  }, [pathname, topicDetailMatch, topicIdFromUrl, topicData])

  return crumbs
}
