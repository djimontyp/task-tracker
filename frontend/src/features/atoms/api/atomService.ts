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

const API_BASE_URL = ''

class AtomService {
  async listAtoms(skip: number = 0, limit: number = 50): Promise<AtomListResponse> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    })

    const response = await fetch(`${API_BASE_URL}${API_BASE_PATH}/atoms?${params}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch atoms: ${response.statusText}`)
    }

    return response.json()
  }

  async getAtomById(id: number): Promise<Atom> {
    const response = await fetch(`${API_BASE_URL}${API_BASE_PATH}/atoms/${id}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch atom: ${response.statusText}`)
    }

    return response.json()
  }

  async createAtom(data: CreateAtom): Promise<Atom> {
    const response = await fetch(`${API_BASE_URL}${API_BASE_PATH}/atoms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to create atom: ${response.statusText}`)
    }

    return response.json()
  }

  async updateAtom(id: number, data: UpdateAtom): Promise<Atom> {
    const response = await fetch(`${API_BASE_URL}${API_BASE_PATH}/atoms/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to update atom: ${response.statusText}`)
    }

    return response.json()
  }

  async deleteAtom(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API_BASE_PATH}/atoms/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`Failed to delete atom: ${response.statusText}`)
    }
  }

  async getAtomsByTopic(topicId: string): Promise<Atom[]> {
    const response = await fetch(`${API_BASE_URL}${API_BASE_PATH}/topics/${topicId}/atoms`)

    if (!response.ok) {
      throw new Error(`Failed to fetch atoms for topic: ${response.statusText}`)
    }

    const data = await response.json()
    return data.items || data
  }

  async linkAtomToTopic(atomId: number, topicId: string, note?: string, position?: number): Promise<TopicAtom> {
    const params = new URLSearchParams()
    if (note) params.append('note', note)
    if (position !== undefined) params.append('position', position.toString())

    const url = `${API_BASE_URL}${API_BASE_PATH}/atoms/${atomId}/topics/${topicId}${params.toString() ? '?' + params.toString() : ''}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to link atom to topic: ${response.statusText}`)
    }

    return response.json()
  }

  async unlinkAtomFromTopic(atomId: number, topicId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API_BASE_PATH}/topic-atoms/${topicId}/${atomId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`Failed to unlink atom from topic: ${response.statusText}`)
    }
  }

  async createAtomLink(data: CreateAtomLink): Promise<AtomLink> {
    const response = await fetch(`${API_BASE_URL}${API_BASE_PATH}/atom-links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to create atom link: ${response.statusText}`)
    }

    return response.json()
  }

  async getAtomLinks(atomId: number): Promise<AtomLink[]> {
    const response = await fetch(`${API_BASE_URL}${API_BASE_PATH}/atoms/${atomId}/links`)

    if (!response.ok) {
      throw new Error(`Failed to fetch atom links: ${response.statusText}`)
    }

    const data = await response.json()
    return data.items || data
  }

  async deleteAtomLink(fromAtomId: number, toAtomId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${API_BASE_PATH}/atom-links/${fromAtomId}/${toAtomId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`Failed to delete atom link: ${response.statusText}`)
    }
  }
}

export const atomService = new AtomService()
