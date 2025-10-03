import React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/avatar'
import { cn } from '@/shared/lib/index'

interface AvatarItem {
  id: string
  name: string
  avatarUrl?: string
}

interface AvatarGroupProps {
  avatars: AvatarItem[]
  max?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeConfig = {
  sm: { size: 'h-6 w-6', text: 'text-[10px]', space: '-space-x-1' },
  md: { size: 'h-8 w-8', text: 'text-xs', space: '-space-x-2' },
  lg: { size: 'h-10 w-10', text: 'text-sm', space: '-space-x-2' },
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 3,
  size = 'sm',
  className,
}) => {
  const displayAvatars = avatars.slice(0, max)
  const remainingCount = Math.max(0, avatars.length - max)
  const config = sizeConfig[size]

  return (
    <div className={cn('flex', config.space, className)}>
      {displayAvatars.map((avatar, index) => (
        <Avatar
          key={avatar.id}
          className={cn(
            config.size,
            'border border-border/50',
            'ring-2 ring-background',
            'transition-transform hover:scale-110 hover:z-10'
          )}
          style={{ zIndex: displayAvatars.length - index }}
        >
          {avatar.avatarUrl ? (
            <AvatarImage src={avatar.avatarUrl} alt={avatar.name} />
          ) : null}
          <AvatarFallback className={cn('bg-primary/10 text-primary font-medium', config.text)}>
            {avatar.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ))}
      
      {remainingCount > 0 && (
        <Avatar
          className={cn(
            config.size,
            'border border-border/50',
            'ring-2 ring-background'
          )}
          style={{ zIndex: 0 }}
        >
          <AvatarFallback className={cn('bg-muted text-muted-foreground font-medium', config.text)}>
            +{remainingCount}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
