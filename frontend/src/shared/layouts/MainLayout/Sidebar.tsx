import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CheckSquare, BarChart3, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { useUiStore } from '@shared/store/uiStore'

const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useUiStore()

  const navItems = [
    { path: '/', label: 'Dashboard', Icon: LayoutDashboard },
    { path: '/tasks', label: 'Tasks', Icon: CheckSquare },
    { path: '/analytics', label: 'Analytics', Icon: BarChart3 },
    { path: '/settings', label: 'Settings', Icon: Settings },
  ]

  return (
    <>
      <aside
        className={`fixed left-0 top-0 h-full bg-card shadow-lg transition-all duration-300 z-20 border-r border-border ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          {sidebarOpen && <h1 className="text-xl font-bold text-primary">Task Tracker</h1>}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-accent/10 transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.Icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'text-foreground hover:bg-accent/10'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
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