import { ReactNode } from 'react'
import { SidebarProvider, SidebarInset } from '@/shared/ui/sidebar'
import { Sheet, SheetContent } from '@/shared/ui/sheet'
import { AppSidebar } from '@/shared/components/AppSidebar'
import { AdminPanel } from '@/shared/components/AdminPanel'
import { useUiStore } from '@/shared/store/uiStore'
import { useAdminMode, useKeyboardShortcut, useMediaQuery } from '@/shared/hooks'
import { toast } from 'sonner'
import { SearchContainer } from '@/features/search/components'
import Navbar from './Navbar'

interface MainLayoutProps {
  children: ReactNode
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { sidebarOpen, setSidebarOpen } = useUiStore()
  const { isAdminMode, toggleAdminMode } = useAdminMode()
  const isDesktop = useMediaQuery('(min-width: 768px)')

  useKeyboardShortcut({
    key: 'a',
    metaKey: true,
    shiftKey: true,
    callback: () => {
      toggleAdminMode()
      toast.success(
        isAdminMode ? 'Admin Mode Disabled' : 'Admin Mode Enabled',
        { duration: 2000 }
      )
    },
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
          <AppSidebar />

          {/* Column 2: Navbar + Content */}
          <div className="grid grid-rows-[56px_1fr] overflow-hidden">
            {/* Row 1: Navbar (fixed height 56px) */}
            <Navbar isDesktop={true} searchComponent={<SearchContainer />} />

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
            onMobileSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
            isDesktop={false}
            searchComponent={<SearchContainer />}
          />

          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="p-0 w-[280px]">
              <AppSidebar mobile />
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
