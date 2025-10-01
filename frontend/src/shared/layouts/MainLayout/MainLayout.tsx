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
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 2xl:p-10 3xl:p-12">
          <div className="container">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default MainLayout