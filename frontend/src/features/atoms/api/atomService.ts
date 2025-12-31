/**
 * Atom API Service
 *
 * Client for knowledge atoms CRUD and linking operations
 */

import apiClient from '@/shared/lib/api/client'
import { API_BASE_PATH } from '@/shared/config/api'
import type {
  Atom,
  AtomListResponse,
  CreateAtom,
  UpdateAtom,
  AtomLink,
  CreateAtomLink,
  TopicAtom,
} from '../types'

class AtomService {
  async listAtoms(skip: number = 0, limit: number = 50): Promise<AtomListResponse> {
    const response = await apiClient.get<AtomListResponse>(`${API_BASE_PATH}/atoms`, {
      params: { skip, limit },
    })
    return response.data
  }

  async getAtomById(id: string): Promise<Atom> {
    const response = await apiClient.get<Atom>(`${API_BASE_PATH}/atoms/${id}`)
    return response.data
  }

  async createAtom(data: CreateAtom): Promise<Atom> {
    const response = await apiClient.post<Atom>(`${API_BASE_PATH}/atoms`, data)
    return response.data
  }

  async updateAtom(id: string, data: UpdateAtom): Promise<Atom> {
    const response = await apiClient.patch<Atom>(`${API_BASE_PATH}/atoms/${id}`, data)
    return response.data
  }

  async deleteAtom(id: string): Promise<void> {
    await apiClient.delete(`${API_BASE_PATH}/atoms/${id}`)
  }

  async getAtomsByTopic(topicId: string): Promise<Atom[]> {
    const response = await apiClient.get<{ items?: Atom[] } | Atom[]>(
      `${API_BASE_PATH}/topics/${topicId}/atoms`
    )
    const data = response.data
    return Array.isArray(data) ? data : data.items || []
  }

  async linkAtomToTopic(
    atomId: string,
    topicId: string,
    note?: string,
    position?: number
  ): Promise<TopicAtom> {
    const response = await apiClient.post<TopicAtom>(
      `${API_BASE_PATH}/atoms/${atomId}/topics/${topicId}`,
      undefined,
      {
        params: {
          note: note || undefined,
          position: position !== undefined ? position : undefined,
        },
      }
    )
    return response.data
  }

  async unlinkAtomFromTopic(atomId: string, topicId: string): Promise<void> {
    await apiClient.delete(`${API_BASE_PATH}/topic-atoms/${topicId}/${atomId}`)
  }

  async createAtomLink(data: CreateAtomLink): Promise<AtomLink> {
    const response = await apiClient.post<AtomLink>(`${API_BASE_PATH}/atom-links`, data)
    return response.data
  }

  async getAtomLinks(atomId: string): Promise<AtomLink[]> {
    const response = await apiClient.get<{ items?: AtomLink[] } | AtomLink[]>(
      `${API_BASE_PATH}/atoms/${atomId}/links`
    )
    const data = response.data
    return Array.isArray(data) ? data : data.items || []
  }

  async deleteAtomLink(fromAtomId: string, toAtomId: string): Promise<void> {
    await apiClient.delete(`${API_BASE_PATH}/atom-links/${fromAtomId}/${toAtomId}`)
  }
}

export const atomService = new AtomService()
