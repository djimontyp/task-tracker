import { ReactNode } from 'react'
import { SidebarProvider, SidebarInset } from '@/shared/ui/sidebar'
import { AppSidebar } from '@/shared/components/AppSidebar'
import Header from './Header'

interface MainLayoutProps {
  children: ReactNode
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <SidebarProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-4"
      >
        Skip to main content
      </a>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main id="main-content" className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 2xl:px-10 3xl:px-12 py-3 sm:py-4 md:py-5 lg:py-6 xl:py-8 2xl:py-10 3xl:py-12">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default MainLayout
