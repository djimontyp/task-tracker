import { ReactNode } from 'react'
import { SidebarProvider, SidebarInset } from '@/shared/ui/sidebar'
import { Sheet, SheetContent } from '@/shared/ui/sheet'
import { AppSidebar } from '@/shared/components/AppSidebar'
import { AdminPanel } from '@/shared/components/AdminPanel'
import { useUiStore } from '@/shared/store/uiStore'
import { useAdminMode, useKeyboardShortcut, useMediaQuery } from '@/shared/hooks'
import { toast } from 'sonner'
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
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-4"
      >
        Skip to main content
      </a>

      <Navbar
        onMobileSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        isDesktop={isDesktop}
      />

      {isDesktop ? (
        <div className="flex flex-col min-h-screen pt-14 overflow-x-hidden">
          <div className="flex flex-1 min-w-0">
            <AppSidebar />
            <SidebarInset className="min-w-0 flex-1">
              <div className="flex-1 overflow-auto">
                <main id="main-content" className="container max-w-screen-2xl mx-auto flex flex-1 flex-col gap-4 p-4 w-full min-w-0">
                  {children}
                </main>
              </div>
            </SidebarInset>
          </div>

          <AdminPanel visible={isAdminMode}>
            <div className="text-sm text-muted-foreground">
              Admin tools will be added in Phase 2-6
            </div>
          </AdminPanel>
        </div>
      ) : (
        <>
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="p-0 w-[280px]">
              <AppSidebar mobile />
            </SheetContent>
          </Sheet>

          <div className="flex flex-col min-h-screen pt-14 md:pt-16 overflow-x-hidden">
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
