import { ReactNode, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { SidebarProvider, SidebarInset } from '@/shared/ui/sidebar'
import { Sheet, SheetContent } from '@/shared/ui/sheet'
import { AppSidebar } from '@/shared/components/AppSidebar'
import { AdminPanel } from '@/shared/components/AdminPanel'
import { useUiStore } from '@/shared/store/uiStore'
import { useAdminMode, useKeyboardShortcut, useMediaQuery, useWebSocket } from '@/shared/hooks'
import { toast } from 'sonner'
import { SearchContainer } from '@/features/search/components'
import { statsService, type SidebarCounts } from '@/shared/api/statsService'
import { Navbar } from '@/shared/components/Navbar'
import { topicService } from '@/features/topics/api/topicService'
import { useNavbarData, type UseNavbarDataConfig } from './useNavbarData'

interface MainLayoutProps {
  children: ReactNode
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { sidebarOpen, setSidebarOpen } = useUiStore()
  const { isAdminMode, toggleAdminMode } = useAdminMode()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const location = useLocation()
  const queryClient = useQueryClient()

  // Dependency injection config for useNavbarData
  const navbarConfig = useMemo<UseNavbarDataConfig>(
    () => ({
      fetchTopicById: (id: string) => topicService.getTopicById(id),
    }),
    []
  )

  // Navbar data from container hook (presenter/container pattern)
  const navbarData = useNavbarData(navbarConfig)

  // Sidebar counts data fetching (moved from AppSidebar for portability)
  const { data: sidebarCounts } = useQuery<SidebarCounts>({
    queryKey: ['sidebar-counts'],
    queryFn: () => statsService.getSidebarCounts(),
    refetchInterval: 30000,
  })

  // WebSocket for sidebar counts updates
  useWebSocket({
    topics: ['analysis', 'proposals', 'noise_filtering'],
    onMessage: (data) => {
      const message = data as { topic: string; event: string }
      const { topic, event: eventType } = message

      if (topic === 'analysis' && ['run_created', 'run_closed', 'run_failed'].includes(eventType)) {
        queryClient.invalidateQueries({ queryKey: ['sidebar-counts'] })
      }
      if (topic === 'proposals' && ['proposal_created', 'proposal_approved', 'proposal_rejected'].includes(eventType)) {
        queryClient.invalidateQueries({ queryKey: ['sidebar-counts'] })
      }
      if (topic === 'noise_filtering' && ['message_scored', 'batch_scored'].includes(eventType)) {
        queryClient.invalidateQueries({ queryKey: ['sidebar-counts'] })
      }
    },
    reconnect: true,
  })

  // Admin Mode toggle: Cmd+Shift+A (macOS) / Ctrl+Shift+A (Win/Linux)
  const handleAdminToggle = () => {
    toggleAdminMode()
    toast.success(
      isAdminMode ? 'Admin Mode Disabled' : 'Admin Mode Enabled',
      { duration: 2000 }
    )
  }

  // macOS: Cmd+Shift+A
  useKeyboardShortcut({
    key: 'a',
    metaKey: true,
    shiftKey: true,
    callback: handleAdminToggle,
  })

  // Windows/Linux: Ctrl+Shift+A
  useKeyboardShortcut({
    key: 'a',
    ctrlKey: true,
    shiftKey: true,
    callback: handleAdminToggle,
  })

  return (
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
      defaultOpen={sidebarOpen}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-modal focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-4"
      >
        Skip to main content
      </a>

      {isDesktop ? (
        // Desktop: Grid layout (full-height sidebar + navbar offset)
        <div className="grid grid-cols-[auto_1fr] w-full h-screen overflow-hidden">
          {/* Column 1: Sidebar (auto width: 256px expanded or 56px collapsed) */}
          <AppSidebar counts={sidebarCounts} currentPath={location.pathname} />

          {/* Column 2: Navbar + Content */}
          <div className="grid grid-rows-[56px_1fr] overflow-hidden">
            {/* Row 1: Navbar (fixed height 56px) */}
            <Navbar
              {...navbarData}
              isDesktop={true}
              searchComponent={<SearchContainer />}
            />

            {/* Row 2: Main content (fills remaining space, full-width per design system) */}
            <SidebarInset className="overflow-auto">
              <main
                id="main-content"
                className="px-4 lg:px-6 xl:px-8 2xl:px-10 py-4 w-full"
              >
                {children}
              </main>
            </SidebarInset>
          </div>

          {/* Admin Panel */}
          <AdminPanel visible={isAdminMode}>
            <div className="text-sm text-muted-foreground">
              Admin tools will be added in Phase 2-6
            </div>
          </AdminPanel>
        </div>
      ) : (
        <>
          {/* Mobile: Top navbar */}
          <Navbar
            {...navbarData}
            onMobileSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
            isDesktop={false}
            searchComponent={<SearchContainer />}
          />

          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="p-0 w-[280px]">
              <AppSidebar mobile counts={sidebarCounts} currentPath={location.pathname} />
            </SheetContent>
          </Sheet>

          {/* pt-[104px]: navbar row1 (56px) + row2 breadcrumbs (~48px) */}
          <div className="flex flex-col min-h-screen pt-[104px] md:pt-16 overflow-x-hidden">
            <main id="main-content" className="flex flex-1 flex-col gap-4 p-2 md:p-4 max-w-full">
              {children}
            </main>

            <AdminPanel visible={isAdminMode}>
              <div className="text-sm text-muted-foreground">
                Admin tools will be added in Phase 2-6
              </div>
            </AdminPanel>
          </div>
        </>
      )}
    </SidebarProvider>
  )
}

export default MainLayout
