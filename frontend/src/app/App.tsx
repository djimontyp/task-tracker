import { Toaster } from '@/shared/ui'
import Providers from './providers'
import AppRoutes from './routes'
import '../index.css'
import '../theme.css'

const App = () => {
  return (
    <Providers>
      <AppRoutes />
      <Toaster />
    </Providers>
  )
}

export default App