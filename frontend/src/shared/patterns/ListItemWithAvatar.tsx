/**
 * ListItemWithAvatar - List item with avatar and metadata
 *
 * A common pattern for displaying user/entity items in lists.
 * Used in: MessageList, UserList, RecentActivity, etc.
 *
 * @example
 * <ListItemWithAvatar
 *   avatar={{ src: user.avatar, fallback: user.initials }}
 *   title={user.name}
 *   subtitle={user.email}
 *   meta={<Badge>Admin</Badge>}
 *   onClick={() => selectUser(user.id)}
 * />
 */

import type { ReactNode } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/avatar';
import { cn } from '@/shared/lib/utils';
import { gap, avatars, focus, transitions } from '@/shared/tokens';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarConfig {
  /** Image source URL */
  src?: string;
  /** Fallback text (initials) */
  fallback?: string;
  /** Alt text for accessibility */
  alt?: string;
}

export interface ListItemWithAvatarProps {
  /** Avatar configuration */
  avatar: AvatarConfig;
  /** Avatar size */
  avatarSize?: AvatarSize;
  /** Main title text */
  title: string;
  /** Subtitle or secondary text */
  subtitle?: string;
  /** Additional metadata (badge, timestamp, etc.) */
  meta?: ReactNode;
  /** Right-aligned action or info */
  trailing?: ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Additional className */
  className?: string;
  /** Show divider below item */
  divider?: boolean;
  /** Highlight state (e.g., unread) */
  highlighted?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function ListItemWithAvatar({
  avatar,
  avatarSize = 'md',
  title,
  subtitle,
  meta,
  trailing,
  onClick,
  className,
  divider = false,
  highlighted = false,
}: ListItemWithAvatarProps) {
  const isInteractive = !!onClick;

  return (
    <div
      className={cn(
        'flex items-center',
        gap.md,
        'py-2',
        divider && 'border-b border-border',
        highlighted && 'bg-accent/50',
        isInteractive && [
          'cursor-pointer',
          'rounded-md -mx-2 px-2',
          transitions.default,
          'hover:bg-accent/50',
          focus.ring,
        ],
        className
      )}
      onClick={onClick}
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? 'button' : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      {/* Avatar */}
      <Avatar className={cn(avatars.size[avatarSize], 'shrink-0')}>
        {avatar.src && <AvatarImage src={avatar.src} alt={avatar.alt || title} />}
        <AvatarFallback>{avatar.fallback || title.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={cn('flex items-center', gap.sm)}>
          <h4 className="font-medium truncate">{title}</h4>
          {meta}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>

      {/* Trailing */}
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// VARIANT: Compact List Item (smaller spacing)
// ═══════════════════════════════════════════════════════════════

export interface CompactListItemProps {
  /** Icon or small avatar */
  icon?: ReactNode;
  /** Main text */
  title: string;
  /** Secondary text */
  subtitle?: string;
  /** Click handler */
  onClick?: () => void;
  /** Additional className */
  className?: string;
}

export function CompactListItem({
  icon,
  title,
  subtitle,
  onClick,
  className,
}: CompactListItemProps) {
  const isInteractive = !!onClick;

  return (
    <div
      className={cn(
        'flex items-center',
        gap.sm,
        'py-2',
        isInteractive && [
          'cursor-pointer',
          'rounded-md -mx-2 px-2',
          transitions.fast,
          'hover:bg-accent/50',
        ],
        className
      )}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
    >
      {icon && <div className="shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium truncate">{title}</span>
        {subtitle && (
          <span className="text-xs text-muted-foreground ml-2">{subtitle}</span>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// VARIANT: List Item with Badge Overlay on Avatar
// ═══════════════════════════════════════════════════════════════

export interface ListItemWithBadgeProps extends ListItemWithAvatarProps {
  /** Badge content (icon, number, etc.) */
  badge?: ReactNode;
  /** Badge position */
  badgePosition?: 'topRight' | 'bottomRight';
  /** Badge background color class */
  badgeColor?: string;
}

export function ListItemWithBadge({
  badge: _badge,
  badgePosition: _badgePosition = 'bottomRight',
  badgeColor: _badgeColor = 'bg-primary',
  avatar,
  avatarSize = 'md',
  ...props
}: ListItemWithBadgeProps) {
  // TODO: Implement badge overlay on avatar
  // Currently passes through to ListItemWithAvatar
  return (
    <ListItemWithAvatar
      {...props}
      avatar={avatar}
      avatarSize={avatarSize}
      className={cn(avatars.withBadge, props.className)}
    />
  );
}

// ═══════════════════════════════════════════════════════════════
// WRAPPER: List Container
// ═══════════════════════════════════════════════════════════════

export interface ListContainerProps {
  children: ReactNode;
  /** Show dividers between items */
  divided?: boolean;
  /** Additional className */
  className?: string;
}

export function ListContainer({ children, divided = false, className }: ListContainerProps) {
  return (
    <div
      className={cn(
        divided && '[&>*:not(:last-child)]:border-b [&>*:not(:last-child)]:border-border',
        className
      )}
    >
      {children}
    </div>
  );
}
