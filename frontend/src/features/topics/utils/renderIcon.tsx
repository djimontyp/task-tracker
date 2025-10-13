import * as HeroIcons from '@heroicons/react/24/outline'

export const renderTopicIcon = (
  iconName?: string | null,
  className = 'h-5 w-5',
  color?: string | null
) => {
  const defaultIcon = <HeroIcons.FolderIcon className={className} />

  if (!iconName) {
    return defaultIcon
  }

  const Icon = (HeroIcons as any)[iconName]

  if (!Icon) {
    return defaultIcon
  }

  const iconStyle = color ? { color } : undefined

  return <Icon className={className} style={iconStyle} />
}
