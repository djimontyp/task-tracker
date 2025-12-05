import * as LucideIcons from 'lucide-react'

export const renderTopicIcon = (
  iconName?: string | null,
  className = 'h-5 w-5',
  color?: string | null
) => {
  const defaultIcon = <LucideIcons.Folder className={className} />

  if (!iconName) {
    return defaultIcon
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[iconName]

  if (!Icon) {
    return defaultIcon
  }

  const iconStyle = color ? { color } : undefined

  return <Icon className={className} style={iconStyle} />
}
