import axios from 'axios'
import { logger } from '@/shared/utils/logger'

// Prefer relative base URL to work behind Nginx at http://localhost
// Fallbacks: explicit envs or localhost:8000 for standalone API dev
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  ''

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    logger.error('API Error:', error)
    return Promise.reject(error)
  }
)

export default apiClient
