import React from 'react';
import {
  XMarkIcon,
  Bars3Icon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  disabled?: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  menuItems: MenuItem[];
  activeItem: string;
  onItemClick: (itemId: string) => void;
  className?: string;
}

export function Sidebar({
  isOpen,
  onToggle,
  menuItems,
  activeItem,
  onItemClick,
  className = ''
}: SidebarProps) {
  // Helper function to render icon based on string
  const renderIcon = (iconName: string) => {
    const iconClass = "h-5 w-5";

    // Basic icon mapping - you can extend this based on your needs
    const iconMap: Record<string, JSX.Element> = {
      dashboard: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={iconClass}>
          <path fillRule="evenodd" d="M2.25 2.25a.75.75 0 000 1.5H3v10.5a3 3 0 003 3h1.21l-1.172 3.513a.75.75 0 001.424.474l.329-.987h8.418l.33.987a.75.75 0 001.422-.474l-1.17-3.513H18a3 3 0 003-3V3.75h.75a.75.75 0 000-1.5H2.25zm6.04 16.5l.5-1.5h6.42l.5 1.5H8.29zm7.46-12a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0v-6zm-3 2.25a.75.75 0 00-1.5 0v3.75a.75.75 0 001.5 0V9zm-3 2.25a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5z" clipRule="evenodd" />
        </svg>
      ),
      tasks: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={iconClass}>
          <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
        </svg>
      ),
      messages: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={iconClass}>
          <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
          <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
        </svg>
      ),
      settings: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={iconClass}>
          <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
        </svg>
      ),
    };

    return iconMap[iconName] || (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconClass}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
      </svg>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full bg-white shadow-xl z-50 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${className}`}>
        <div className="relative flex flex-col bg-clip-border rounded-none bg-white text-gray-700 h-full w-80 shadow-xl shadow-blue-gray-900/5 border-r">
          {/* Header */}
          <div className="mb-2 flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path fillRule="evenodd" d="M2.25 2.25a.75.75 0 000 1.5H3v10.5a3 3 0 003 3h1.21l-1.172 3.513a.75.75 0 001.424.474l.329-.987h8.418l.33.987a.75.75 0 001.422-.474l-1.17-3.513H18a3 3 0 003-3V3.75h.75a.75.75 0 000-1.5H2.25zm6.04 16.5l.5-1.5h6.42l.5 1.5H8.29zm7.46-12a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0v-6zm-3 2.25a.75.75 0 00-1.5 0v3.75a.75.75 0 001.5 0V9zm-3 2.25a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex flex-col">
                <h5 className="block font-sans text-xl antialiased font-semibold leading-snug tracking-normal text-blue-gray-900">
                  Task Tracker
                </h5>
                <p className="block font-sans text-sm antialiased font-normal leading-normal text-gray-700">
                  Dashboard
                </p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg text-blue-gray-500 hover:bg-blue-gray-50 transition-colors"
              aria-label="Close navigation drawer"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation List */}
          <nav className="flex flex-col gap-1 p-2 font-sans text-base font-normal text-gray-700 flex-1 overflow-y-auto">
            {menuItems.map((item) => (
              <div
                key={item.id}
                role="button"
                onClick={() => !item.disabled && onItemClick(item.id)}
                className={`flex items-center w-full p-3 leading-tight transition-all rounded-lg outline-none text-start cursor-pointer ${
                  activeItem === item.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'hover:bg-blue-gray-50 hover:bg-opacity-80 hover:text-blue-gray-900 focus:bg-blue-gray-50 focus:bg-opacity-80 focus:text-blue-gray-900 active:bg-blue-gray-50 active:bg-opacity-80 active:text-blue-gray-900'
                } ${
                  item.disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                aria-current={activeItem === item.id ? 'page' : undefined}
                tabIndex={item.disabled ? -1 : 0}
              >
                <div className="grid mr-4 place-items-center">
                  {renderIcon(item.icon)}
                </div>
                <span className="flex-1 font-medium">
                  {item.label}
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <div className={`relative grid items-center px-2 py-1 font-sans text-xs font-bold uppercase rounded-full select-none whitespace-nowrap ${
                    activeItem === item.id
                      ? 'bg-white/20 text-white'
                      : 'bg-red-500 text-white'
                  }`}>
                    <span>{item.badge > 99 ? '99+' : item.badge}</span>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Footer Status */}
          <div className="p-4 border-t">
            <div className="relative flex flex-col bg-green-50 text-gray-700 rounded-xl border border-green-200 p-3">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="h-4 w-4 text-green-600 flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <p className="block font-sans text-sm antialiased font-medium leading-normal text-green-900 truncate">
                    System Status
                  </p>
                  <p className="block font-sans text-sm antialiased font-normal leading-normal text-green-700 truncate">
                    All systems operational
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function SidebarToggle({
  isOpen,
  onToggle,
  className = ''
}: {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center justify-center w-10 h-10 rounded-lg text-blue-gray-500 hover:bg-blue-gray-50 transition-colors ${className}`}
      aria-label={isOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
      aria-expanded={isOpen}
    >
      <Bars3Icon className="h-6 w-6" />
    </button>
  );
}