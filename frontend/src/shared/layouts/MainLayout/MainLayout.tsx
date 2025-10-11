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
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 2xl:px-10 3xl:px-12 py-3 sm:py-4 md:py-5 lg:py-6 xl:py-8 2xl:py-10 3xl:py-12">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default MainLayout