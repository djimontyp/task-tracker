import { apiClient } from '@/shared/lib/api/client'

export interface User {
  id: string
  username: string
  email: string
  avatar_url: string | null
  full_name: string | null
  is_active: boolean
  created_at: string
}

class UserService {
  async getUser(userId: string): Promise<User> {
    const { data } = await apiClient.get<User>(`/users/${userId}`)
    return data
  }

  async listUsers(): Promise<User[]> {
    const { data } = await apiClient.get<User[]>('/users')
    return data
  }
}

export const userService = new UserService()
