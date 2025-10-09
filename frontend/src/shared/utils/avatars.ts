/**
 * Avatar utilities for generating placeholder avatars
 * Uses UIAvatars service for consistent placeholder generation
 */

export interface AvatarData {
  id: string
  name: string
  avatarUrl: string
}

/**
 * Generates placeholder avatar URL using UIAvatars service
 * @param name - User name to generate avatar for
 * @param seed - Optional seed for consistent avatar generation
 */
export const generatePlaceholderAvatar = (name: string, seed?: string): string => {
  const initials = name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const background = seed
    ? hashStringToColor(seed)
    : hashStringToColor(name)

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${background}&color=fff&size=256&bold=true`
}

/**
 * Generates a deterministic color from a string
 */
const hashStringToColor = (str: string): string => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  const colors = [
    '6366f1', // indigo
    '8b5cf6', // violet
    'ec4899', // pink
    'f59e0b', // amber
    '10b981', // emerald
    '06b6d4', // cyan
    '3b82f6', // blue
    'ef4444', // red
  ]

  const index = Math.abs(hash) % colors.length
  return colors[index]
}

/**
 * Generates mock avatars for a task based on task ID
 * This simulates assigned users until backend provides real data
 * @param taskId - Task identifier
 * @param count - Number of avatars to generate (default: random 1-3)
 */
export const generateTaskAvatars = (taskId: string | number, count?: number): AvatarData[] => {
  const numId = typeof taskId === 'string' ? parseInt(taskId, 10) : taskId
  const avatarCount = count ?? ((numId % 3) + 1) // 1-3 avatars based on task ID

  return Array.from({ length: avatarCount }, (_, idx) => ({
    id: `task-${taskId}-avatar-${idx}`,
    name: `User ${idx + 1}`,
    avatarUrl: generatePlaceholderAvatar(`User ${idx + 1}`, `${taskId}-${idx}`),
  }))
}
