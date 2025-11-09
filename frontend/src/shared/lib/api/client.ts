import axios from 'axios'
import { logger } from '@/shared/utils/logger'

// Use empty baseURL for relative URLs - axios will use current origin
// This works with localhost, IP addresses, and .local hostnames
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || undefined

if (API_BASE_URL) {
  logger.info('API Base URL (from env):', API_BASE_URL)
} else {
  logger.info('API Base URL: using relative URLs (current origin)')
}

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
