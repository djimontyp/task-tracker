import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import * as HeroIcons from '@heroicons/react/24/outline'
import { formatMessageDate } from '@/shared/utils/date'
import { Topic } from '@/shared/types'

interface TopicCardProps {
  topic: Topic
}

export const TopicCard = ({ topic }: TopicCardProps) => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/topics/${topic.id}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  const topicColor = topic.color || 'hsl(var(--topic-default))'

  const IconComponent = topic.icon
    ? (HeroIcons[topic.icon as keyof typeof HeroIcons] as React.ComponentType<{ className?: string }>) || HeroIcons.FolderIcon
    : HeroIcons.FolderIcon

  return (
    <Card
      className="group cursor-pointer min-h-[96px] transition-all duration-300 ease-out hover:duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        borderLeft: `4px solid ${topicColor}`,
        background: `linear-gradient(135deg, hsl(var(--card)) 0%, color-mix(in srgb, ${topicColor} 3%, hsl(var(--card))) 100%)`,
        boxShadow: `var(--shadow-card), inset 4px 0 0 0 ${topicColor}20, inset 0 0 0 1px hsl(var(--border) / 0.5)`,
        '--ring-color': `color-mix(in srgb, ${topicColor} 70%, hsl(var(--ring)))`,
      } as React.CSSProperties & { '--ring-color': string }}
      tabIndex={0}
      role="button"
      aria-label={`View ${topic.name} topic with ${topic.message_count || 0} messages`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <CardContent className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span
                className="w-5 h-5 flex items-center justify-center shrink-0 rounded-full transition-all duration-300"
                style={{
                  background: `color-mix(in srgb, ${topicColor} 8%, transparent)`,
                  color: `color-mix(in srgb, ${topicColor} 80%, hsl(var(--foreground)))`,
                }}
                role="img"
                aria-hidden="true"
              >
                <IconComponent className="w-4 h-4" />
              </span>
              <h3
                className="text-base font-semibold leading-[1.4] tracking-[-0.01em] truncate transition-colors duration-300 group-hover:opacity-90"
                style={{ color: 'hsl(var(--foreground))' }}
              >
                {topic.name}
              </h3>
            </div>
            {topic.description && (
              <p className="text-sm leading-[1.5] text-muted-foreground opacity-70 line-clamp-2 mb-3">
                {topic.description}
              </p>
            )}
            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className="h-6 px-2 text-xs font-semibold uppercase tracking-wider bg-background/60 backdrop-blur-sm border shadow-sm"
                style={{
                  borderColor: `color-mix(in srgb, ${topicColor} 30%, hsl(var(--border)))`,
                  color: `color-mix(in srgb, ${topicColor} 70%, hsl(var(--foreground)))`,
                }}
              >
                <HeroIcons.ChatBubbleLeftIcon className="w-3 h-3 mr-2 opacity-80" />
                {topic.message_count || 0}
              </Badge>
              <div
                className="flex items-center gap-2 text-xs font-medium"
                style={{ color: `color-mix(in srgb, ${topicColor} 60%, hsl(var(--muted-foreground)))` }}
              >
                <HeroIcons.LightBulbIcon className="w-3.5 h-3.5 opacity-75" />
                <span className="tabular-nums">{topic.atoms_count || 0}</span>
                <span className="font-normal opacity-60">atoms</span>
              </div>
              {topic.last_message_at && (
                <span className="ml-auto text-xs font-normal text-muted-foreground opacity-50 tabular-nums">
                  {formatMessageDate(topic.last_message_at)}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
