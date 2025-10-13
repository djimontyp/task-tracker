import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { MainLayout } from '@/shared/layouts'
import Spinner from '@/shared/ui/Spinner'

// Lazy load all pages for better initial bundle size
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
const SettingsPage = lazy(() => import('@pages/SettingsPage'))

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
        <Route element={<MainLayout><AnalyticsPage /></MainLayout>} path="/analytics" />
        <Route element={<MainLayout><SettingsPage /></MainLayout>} path="/settings" />
      </Routes>
    </Suspense>
  )
}

export default AppRoutes