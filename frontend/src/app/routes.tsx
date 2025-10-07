import { Routes, Route } from 'react-router-dom'
import { MainLayout } from '@shared/layouts'
import DashboardPage from '@pages/DashboardPage'
import TasksPage from '@pages/TasksPage'
import MessagesPage from '@pages/MessagesPage'
import AgentsPage from '@pages/AgentsPage'
import AnalyticsPage from '@pages/AnalyticsPage'
import SettingsPage from '@pages/SettingsPage'

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout><DashboardPage /></MainLayout>} path="/" />
      <Route element={<MainLayout><TasksPage /></MainLayout>} path="/tasks" />
      <Route element={<MainLayout><MessagesPage /></MainLayout>} path="/messages" />
      <Route element={<MainLayout><AgentsPage /></MainLayout>} path="/agents" />
      <Route element={<MainLayout><AnalyticsPage /></MainLayout>} path="/analytics" />
      <Route element={<MainLayout><SettingsPage /></MainLayout>} path="/settings" />
    </Routes>
  )
}

export default AppRoutes