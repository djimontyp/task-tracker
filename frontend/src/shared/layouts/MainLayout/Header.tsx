import React, { useMemo } from 'react'
import { SwatchIcon } from '@heroicons/react/24/outline'
import { useLocation, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTheme } from '@/shared/components/ThemeProvider'
import { SidebarTrigger } from '@/shared/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/ui/breadcrumb'
import { topicService } from '@/features/topics/api/topicService'
import type { Topic } from '@/features/topics/types'

interface BreadcrumbSegment {
  label: string
  href?: string
}

const breadcrumbMap: Record<string, BreadcrumbSegment[]> = {
  '/': [
    { label: 'Home', href: '/' },
    { label: 'Overview' },
  ],
  '/messages': [
    { label: 'Home', href: '/' },
    { label: 'Data Management', href: '/' },
    { label: 'Messages' },
  ],
  '/topics': [
    { label: 'Home', href: '/' },
    { label: 'Data Management', href: '/' },
    { label: 'Topics' },
  ],
  '/tasks': [
    { label: 'Home', href: '/' },
    { label: 'Data Management', href: '/' },
    { label: 'Tasks' },
  ],
  '/analysis': [
    { label: 'Home', href: '/' },
    { label: 'AI Operations', href: '/analysis' },
    { label: 'Analysis Runs' },
  ],
  '/proposals': [
    { label: 'Home', href: '/' },
    { label: 'AI Operations', href: '/analysis' },
    { label: 'Task Proposals' },
  ],
  '/noise-filtering': [
    { label: 'Home', href: '/' },
    { label: 'AI Operations', href: '/analysis' },
    { label: 'Noise Filtering' },
  ],
  '/versions': [
    { label: 'Home', href: '/' },
    { label: 'AI Operations', href: '/analysis' },
    { label: 'Versions' },
  ],
  '/agents': [
    { label: 'Home', href: '/' },
    { label: 'AI Setup', href: '/agents' },
    { label: 'Agents' },
  ],
  '/agent-tasks': [
    { label: 'Home', href: '/' },
    { label: 'AI Setup', href: '/agents' },
    { label: 'Task Templates' },
  ],
  '/providers': [
    { label: 'Home', href: '/' },
    { label: 'AI Setup', href: '/agents' },
    { label: 'Providers' },
  ],
  '/projects': [
    { label: 'Home', href: '/' },
    { label: 'AI Setup', href: '/agents' },
    { label: 'Projects' },
  ],
  '/automation/dashboard': [
    { label: 'Home', href: '/' },
    { label: 'Automation', href: '/automation/dashboard' },
    { label: 'Dashboard' },
  ],
  '/automation/rules': [
    { label: 'Home', href: '/' },
    { label: 'Automation', href: '/automation/dashboard' },
    { label: 'Rules' },
  ],
  '/automation/scheduler': [
    { label: 'Home', href: '/' },
    { label: 'Automation', href: '/automation/dashboard' },
    { label: 'Scheduler' },
  ],
  '/automation/notifications': [
    { label: 'Home', href: '/' },
    { label: 'Automation', href: '/automation/dashboard' },
    { label: 'Notifications' },
  ],
  '/analytics': [
    { label: 'Home', href: '/' },
    { label: 'Analytics & Reports', href: '/analytics' },
    { label: 'Analytics' },
  ],
  '/monitoring': [
    { label: 'Home', href: '/' },
    { label: 'Analytics & Reports', href: '/analytics' },
    { label: 'Task Monitoring' },
  ],
  '/settings': [
    { label: 'Home', href: '/' },
    { label: 'Settings' },
  ],
}

const Header = () => {
  const { effectiveTheme, setTheme, theme } = useTheme()
  const location = useLocation()
  const queryClient = useQueryClient()

  const topicDetailMatch = location.pathname.match(/^\/topics\/(\d+)$/)
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
        { label: 'Home', href: '/' },
        { label: 'Topics', href: '/topics' },
        { label: topicData?.name || 'Topic' },
      ]
    }

    const segments = breadcrumbMap[location.pathname]

    if (!segments) {
      return location.pathname
        .split('/')
        .filter(Boolean)
        .map((segment) => ({
          label: segment.charAt(0).toUpperCase() + segment.replace(/-/g, ' ').slice(1),
        }))
    }

    return segments
  }, [location.pathname, topicDetailMatch, topicIdFromUrl, topicData])

  const handleToggleTheme = () => {
    // Cycle: light -> dark -> system
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border/80">
      <div className="flex min-h-[56px] items-center justify-between gap-2 px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 2xl:px-10 3xl:px-12">
        <div className="flex items-center gap-2">
          <SidebarTrigger
            variant="ghost"
            size="icon"
            className="h-8 w-8 border-0 bg-transparent text-muted-foreground hover:bg-accent/20 hover:text-foreground"
          />
          <Breadcrumb>
            <BreadcrumbList>
              {crumbs.map((segment, index) => {
                const isLast = index === crumbs.length - 1
                return (
                  <React.Fragment key={`${segment.label}-${index}`}>
                    <BreadcrumbItem>
                      {segment.href && !isLast ? (
                        <BreadcrumbLink asChild>
                          <Link to={segment.href}>{segment.label}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator />}
                  </React.Fragment>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleTheme}
            className="p-1.5 flex items-center justify-center rounded-lg hover:bg-accent/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Toggle theme"
            title={`Current: ${theme} (${effectiveTheme})`}
          >
            <SwatchIcon className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header