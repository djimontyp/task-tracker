import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CheckSquare, BarChart3, Settings, ChevronLeft } from 'lucide-react'
import { useUiStore } from '@/shared/store/uiStore'

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
          <h1
            className={`text-xl font-bold text-primary transition-all duration-300 overflow-hidden whitespace-nowrap ${
              sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'
            }`}
          >
            Topics Radar
          </h1>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-accent/10 transition-all duration-200 cursor-pointer"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft className={`flex-shrink-0 max-w-[24px] w-full h-auto transition-transform duration-300 ${!sidebarOpen ? 'rotate-180' : ''}`} />
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
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'text-foreground hover:bg-accent/10 hover:scale-[1.02]'
                  }`
                }
              >
                <Icon className="flex-shrink-0 max-w-[24px] w-full h-auto" />
                <span
                  className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
                    sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'
                  }`}
                >
                  {item.label}
                </span>
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