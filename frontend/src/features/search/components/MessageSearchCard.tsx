import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent } from '@/shared/ui/card'
import type { MessageSearchResult } from '../types'

interface MessageSearchCardProps {
  result: MessageSearchResult
}

export const MessageSearchCard = ({ result }: MessageSearchCardProps) => {
  const { message, similarity_score } = result

  const getInitials = (profileId: string | number | null) => {
    if (!profileId) return 'U'
    return String(profileId).slice(0, 2).toUpperCase()
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch {
      return timestamp
    }
  }

  const formatSimilarity = (score: number) => {
    return `${Math.round(score * 100)}%`
  }

  return (
    <Card
      className="transition-all hover:shadow-md hover:border-primary/50"
      aria-label={`Message from user ${message.telegram_profile_id || message.author_id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(message.telegram_profile_id)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-medium text-sm">
                {message.telegram_profile_id || `User ${message.author_id}`}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatTimestamp(message.sent_at)}
              </span>
              <Badge variant="outline" className="text-xs">
                {formatSimilarity(similarity_score)} match
              </Badge>
              {message.classification && (
                <Badge variant="secondary" className="text-xs">
                  {message.classification}
                </Badge>
              )}
            </div>
            <div className="text-sm text-foreground/90 line-clamp-3">
              {message.content}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
