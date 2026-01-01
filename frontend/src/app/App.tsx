import { Toaster } from '@/shared/ui'
import { Providers } from './providers'
import { AppRoutes } from './routes'
import { ErrorBoundary } from './ErrorBoundary'
import '../index.css'

export const App = () => {
  return (
    <ErrorBoundary>
      <Providers>
        <AppRoutes />
        <Toaster />
      </Providers>
    </ErrorBoundary>
  )
}