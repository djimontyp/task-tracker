import React, { ReactNode, useState, useEffect } from 'react';
import { Sidebar, SidebarToggle, MenuItem } from './Sidebar';

interface SidebarLayoutProps {
  menuItems: MenuItem[];
  activeItem: string;
  onItemClick: (itemId: string) => void;
  children: ReactNode;
  header?: ReactNode;
  className?: string;
}

export function SidebarLayout({
  menuItems,
  activeItem,
  onItemClick,
  children,
  header,
  className = ''
}: SidebarLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024; // Use lg breakpoint instead of md for better UX
      setIsMobile(mobile);

      // Auto-close sidebar on mobile, auto-open on desktop
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Initial check
    handleResize();

    // Listen for resize events
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleItemClick = (itemId: string) => {
    onItemClick(itemId);

    // Auto-close sidebar on mobile when item is clicked
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className={`flex min-h-screen bg-gray-50 ${className}`}>
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={handleToggleSidebar}
        menuItems={menuItems}
        activeItem={activeItem}
        onItemClick={handleItemClick}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
        !isMobile ? 'lg:ml-80' : 'ml-0'
      }`}>
        {/* Header */}
        {header && (
          <header className="flex items-center gap-4 px-6 py-4 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
            <div className="flex items-center">
              <SidebarToggle
                isOpen={isSidebarOpen}
                onToggle={handleToggleSidebar}
                className="lg:hidden"
              />
            </div>
            <div className="flex-1 flex items-center justify-between">
              {header}
            </div>
          </header>
        )}

        {/* Content */}
        <main className="flex-1 flex flex-col min-h-0 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}