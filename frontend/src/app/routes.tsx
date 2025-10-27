import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { MainLayout } from '@/shared/layouts'
import Spinner from '@/shared/ui/Spinner'

const DashboardPage = lazy(() => import('@pages/DashboardPage'))
const TasksPage = lazy(() => import('@pages/TasksPage'))
const TopicsPage = lazy(() => import('@pages/TopicsPage'))
const TopicDetailPage = lazy(() => import('@pages/TopicDetailPage'))
const MessagesPage = lazy(() => import('@pages/MessagesPage'))
const AgentsPage = lazy(() => import('@pages/AgentsPage'))
const AgentTasksPage = lazy(() => import('@pages/AgentTasksPage'))
const ProvidersPage = lazy(() => import('@pages/ProvidersPage'))
const ProjectsPage = lazy(() => import('@pages/ProjectsPage'))
const AnalyticsPage = lazy(() => import('@pages/AnalyticsPage'))
const AnalysisRunsPage = lazy(() => import('@pages/AnalysisRunsPage'))
const ProposalsPage = lazy(() => import('@pages/ProposalsPage'))
const NoiseFilteringDashboard = lazy(() => import('@pages/NoiseFilteringDashboard'))
const SettingsPage = lazy(() => import('@pages/SettingsPage'))
const AutomationOnboardingPage = lazy(() => import('@pages/AutomationOnboardingPage'))
const AutomationDashboardPage = lazy(() => import('@pages/AutomationDashboardPage'))
const AutomationRulesPage = lazy(() => import('@pages/AutomationRulesPage'))
const SchedulerPage = lazy(() => import('@pages/SchedulerPage'))
const NotificationSettingsPage = lazy(() => import('@pages/NotificationSettingsPage'))
const VersionsPage = lazy(() => import('@pages/VersionsPage'))

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
        <Route element={<MainLayout><MessagesPage /></MainLayout>} path="/messages" />
        <Route element={<MainLayout><TopicsPage /></MainLayout>} path="/topics" />
        <Route element={<MainLayout><TopicDetailPage /></MainLayout>} path="/topics/:topicId" />
        <Route element={<MainLayout><TasksPage /></MainLayout>} path="/tasks" />
        <Route element={<MainLayout><AnalysisRunsPage /></MainLayout>} path="/analysis" />
        <Route element={<MainLayout><ProposalsPage /></MainLayout>} path="/proposals" />
        <Route element={<MainLayout><AgentsPage /></MainLayout>} path="/agents" />
        <Route element={<MainLayout><AgentTasksPage /></MainLayout>} path="/agent-tasks" />
        <Route element={<MainLayout><ProvidersPage /></MainLayout>} path="/providers" />
        <Route element={<MainLayout><ProjectsPage /></MainLayout>} path="/projects" />
        <Route element={<MainLayout><NoiseFilteringDashboard /></MainLayout>} path="/noise-filtering" />
        <Route element={<MainLayout><AnalyticsPage /></MainLayout>} path="/analytics" />
        <Route element={<MainLayout><SettingsPage /></MainLayout>} path="/settings" />
        <Route element={<MainLayout><AutomationOnboardingPage /></MainLayout>} path="/onboarding/automation" />
        <Route element={<MainLayout><AutomationDashboardPage /></MainLayout>} path="/automation/dashboard" />
        <Route element={<MainLayout><AutomationRulesPage /></MainLayout>} path="/automation/rules" />
        <Route element={<MainLayout><SchedulerPage /></MainLayout>} path="/automation/scheduler" />
        <Route element={<MainLayout><NotificationSettingsPage /></MainLayout>} path="/automation/notifications" />
        <Route element={<MainLayout><VersionsPage /></MainLayout>} path="/versions" />
      </Routes>
    </Suspense>
  )
}

export default AppRoutes