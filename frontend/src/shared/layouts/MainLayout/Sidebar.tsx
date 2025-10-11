import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CheckSquare,
  BarChart3,
  Settings,
  ChevronLeft,
  Activity,
  FileCheck,
  MessageSquare,
  Bot,
  Users,
  FolderKanban,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useUiStore } from '@/shared/store/uiStore'
import { Badge } from '@/shared/ui'
import { statsService, type SidebarCounts } from '@/shared/api/statsService'

const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useUiStore()
  const queryClient = useQueryClient()

  // Fetch sidebar counts
  const { data: counts } = useQuery<SidebarCounts>({
    queryKey: ['sidebar-counts'],
    queryFn: () => statsService.getSidebarCounts(),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // WebSocket integration for real-time updates
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost/ws'
    const ws = new WebSocket(`${wsUrl}?topics=analysis,proposals`)

    ws.onopen = () => {
      console.log('WebSocket connected for sidebar counts')
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        const { topic, event: eventType } = message

        // Invalidate counts on relevant events
        if (
          topic === 'analysis' &&
          ['run_created', 'run_closed', 'run_failed'].includes(eventType)
        ) {
          queryClient.invalidateQueries({ queryKey: ['sidebar-counts'] })
        }

        if (
          topic === 'proposals' &&
          ['proposal_created', 'proposal_approved', 'proposal_rejected'].includes(eventType)
        ) {
          queryClient.invalidateQueries({ queryKey: ['sidebar-counts'] })
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
    }

    return () => {
      ws.close()
    }
  }, [queryClient])

  const navItems = [
    // Workspace Section
    { path: '/', label: 'Dashboard', Icon: LayoutDashboard, section: 'workspace' },
    { path: '/messages', label: 'Messages', Icon: MessageSquare, section: 'workspace' },
    { path: '/tasks', label: 'Tasks', Icon: CheckSquare, section: 'workspace' },

    // AI Analysis Section
    {
      path: '/analysis',
      label: 'Analysis Runs',
      Icon: Activity,
      badge: counts?.unclosed_runs,
      section: 'analysis',
    },
    {
      path: '/proposals',
      label: 'Task Proposals',
      Icon: FileCheck,
      badge: counts?.pending_proposals,
      section: 'analysis',
    },

    // AI Config Section
    { path: '/agents', label: 'Agents', Icon: Bot, section: 'config' },
    { path: '/providers', label: 'Providers', Icon: Users, section: 'config' },
    { path: '/projects', label: 'Projects', Icon: FolderKanban, section: 'config' },

    // Insights Section
    { path: '/analytics', label: 'Analytics', Icon: BarChart3, section: 'insights' },
    { path: '/settings', label: 'Settings', Icon: Settings, section: 'insights' },
  ]

  const getSectionLabel = (section: string) => {
    switch (section) {
      case 'workspace':
        return 'WORKSPACE'
      case 'analysis':
        return 'AI ANALYSIS'
      case 'config':
        return 'AI CONFIG'
      case 'insights':
        return 'INSIGHTS'
      default:
        return ''
    }
  }

  let lastSection = ''

  return (
    <>
      <aside
        className={`fixed left-0 top-0 h-full bg-card shadow-lg transition-all duration-300 z-20 border-r border-border ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h1
            className={`text-xl font-bold text-primary transition-all duration-300 overflow-hidden whitespace-nowrap ${
              sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'
            }`}
          >
            Topics Radar
          </h1>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-accent/10 transition-all duration-200 cursor-pointer"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft className={`flex-shrink-0 max-w-[24px] w-full h-auto transition-transform duration-300 ${!sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.Icon
            const showSectionLabel = item.section !== lastSection
            const sectionLabel = getSectionLabel(item.section)
            lastSection = item.section

            return (
              <div key={item.path}>
                {/* Section Label */}
                {showSectionLabel && sidebarOpen && (
                  <div className="px-4 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {sectionLabel}
                  </div>
                )}

                {/* Navigation Item */}
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-foreground hover:bg-accent/10 hover:scale-[1.02]'
                    }`
                  }
                >
                  <Icon className="flex-shrink-0 max-w-[24px] w-full h-auto" />
                  <span
                    className={`flex-1 transition-all duration-300 overflow-hidden whitespace-nowrap ${
                      sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'
                    }`}
                  >
                    {item.label}
                  </span>
                  {/* Badge for notifications */}
                  {item.badge !== undefined && item.badge > 0 && sidebarOpen && (
                    <Badge variant="default" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </NavLink>
              </div>
            )
          })}
        </nav>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
    </>
  )
}

export default Sidebar