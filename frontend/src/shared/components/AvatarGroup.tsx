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

const sizeClasses = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 3,
  size = 'sm',
  className,
}) => {
  const displayAvatars = avatars.slice(0, max)
  const remainingCount = Math.max(0, avatars.length - max)

  return (
    <div className={cn('flex -space-x-2', className)}>
      {displayAvatars.map((avatar, index) => (
        <Avatar
          key={avatar.id}
          className={cn(
            sizeClasses[size],
            'border-2 border-background shadow-sm ring-1 ring-black/5',
            'transition-transform hover:scale-110 hover:z-10'
          )}
          style={{ zIndex: displayAvatars.length - index }}
        >
          {avatar.avatarUrl ? (
            <AvatarImage src={avatar.avatarUrl} alt={avatar.name} />
          ) : null}
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {avatar.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ))}
      
      {remainingCount > 0 && (
        <Avatar
          className={cn(
            sizeClasses[size],
            'border-2 border-background shadow-sm bg-muted',
            'flex items-center justify-center'
          )}
          style={{ zIndex: 0 }}
        >
          <AvatarFallback className="bg-muted text-muted-foreground font-medium">
            +{remainingCount}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
