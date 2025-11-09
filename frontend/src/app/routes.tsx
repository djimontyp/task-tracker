import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/shared/layouts'
import Spinner from '@/shared/ui/Spinner'

const DashboardPage = lazy(() => import('@pages/DashboardPage'))
const TopicsPage = lazy(() => import('@pages/TopicsPage'))
const TopicDetailPage = lazy(() => import('@pages/TopicDetailPage'))
const MessagesPage = lazy(() => import('@pages/MessagesPage'))
const AgentsPage = lazy(() => import('@pages/AgentsPage'))
const AgentTasksPage = lazy(() => import('@pages/AgentTasksPage'))
const ProjectsPage = lazy(() => import('@pages/ProjectsPage'))
const NoiseFilteringDashboard = lazy(() => import('@pages/NoiseFilteringDashboard'))
const SettingsPage = lazy(() => import('@pages/SettingsPage'))
const AutomationOnboardingPage = lazy(() => import('@pages/AutomationOnboardingPage'))
const AutomationDashboardPage = lazy(() => import('@pages/AutomationDashboardPage'))
const AutomationRulesPage = lazy(() => import('@pages/AutomationRulesPage'))
const SchedulerPage = lazy(() => import('@pages/SchedulerPage'))
const SearchPage = lazy(() => import('@pages/SearchPage'))

const AppRoutes = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Spinner size="lg" />
        </div>
      }
    >
      <Routes>
        <Route element={<MainLayout><DashboardPage /></MainLayout>} path="/" />
        <Route element={<MainLayout><SearchPage /></MainLayout>} path="/search" />
        <Route element={<MainLayout><MessagesPage /></MainLayout>} path="/messages" />
        <Route element={<MainLayout><TopicsPage /></MainLayout>} path="/topics" />
        <Route element={<MainLayout><TopicDetailPage /></MainLayout>} path="/topics/:topicId" />
        <Route element={<MainLayout><AgentsPage /></MainLayout>} path="/agents" />
        <Route element={<MainLayout><AgentTasksPage /></MainLayout>} path="/agent-tasks" />
        <Route element={<Navigate to="/settings" replace />} path="/providers" />
        <Route element={<MainLayout><ProjectsPage /></MainLayout>} path="/projects" />
        <Route element={<MainLayout><NoiseFilteringDashboard /></MainLayout>} path="/noise-filtering" />
        <Route element={<MainLayout><SettingsPage /></MainLayout>} path="/settings" />
        <Route element={<MainLayout><AutomationOnboardingPage /></MainLayout>} path="/onboarding/automation" />
        <Route element={<MainLayout><AutomationDashboardPage /></MainLayout>} path="/automation/dashboard" />
        <Route element={<MainLayout><AutomationRulesPage /></MainLayout>} path="/automation/rules" />
        <Route element={<MainLayout><SchedulerPage /></MainLayout>} path="/automation/scheduler" />
      </Routes>
    </Suspense>
  )
}

export default AppRoutes