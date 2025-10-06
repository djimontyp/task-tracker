import React, { ReactNode } from 'react'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/shared/ui/sidebar'
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
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default MainLayout