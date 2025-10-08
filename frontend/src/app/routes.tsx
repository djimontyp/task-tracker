import { Routes, Route } from 'react-router-dom'
import { MainLayout } from '@shared/layouts'
import DashboardPage from '@pages/DashboardPage'
import TasksPage from '@pages/TasksPage'
import TopicsPage from '@pages/TopicsPage'
import MessagesPage from '@pages/MessagesPage'
import AgentsPage from '@pages/AgentsPage'
import AgentTasksPage from '@pages/AgentTasksPage'
import ProvidersPage from '@pages/ProvidersPage'
import ProjectsPage from '@pages/ProjectsPage'
import AnalyticsPage from '@pages/AnalyticsPage'
import AnalysisRunsPage from '@pages/AnalysisRunsPage'
import ProposalsPage from '@pages/ProposalsPage'
import SettingsPage from '@pages/SettingsPage'

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout><DashboardPage /></MainLayout>} path="/" />
      <Route element={<MainLayout><MessagesPage /></MainLayout>} path="/messages" />
      <Route element={<MainLayout><TopicsPage /></MainLayout>} path="/topics" />
      <Route element={<MainLayout><TasksPage /></MainLayout>} path="/tasks" />
      <Route element={<MainLayout><AnalysisRunsPage /></MainLayout>} path="/analysis" />
      <Route element={<MainLayout><ProposalsPage /></MainLayout>} path="/proposals" />
      <Route element={<MainLayout><AgentsPage /></MainLayout>} path="/agents" />
      <Route element={<MainLayout><AgentTasksPage /></MainLayout>} path="/agent-tasks" />
      <Route element={<MainLayout><ProvidersPage /></MainLayout>} path="/providers" />
      <Route element={<MainLayout><ProjectsPage /></MainLayout>} path="/projects" />
      <Route element={<MainLayout><AnalyticsPage /></MainLayout>} path="/analytics" />
      <Route element={<MainLayout><SettingsPage /></MainLayout>} path="/settings" />
    </Routes>
  )
}

export default AppRoutes