import { Toaster } from 'react-hot-toast'
import Providers from './providers'
import AppRoutes from './routes'
import '../index.css'

const App = () => {
  return (
    <Providers>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#363636',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </Providers>
  )
}

export default App