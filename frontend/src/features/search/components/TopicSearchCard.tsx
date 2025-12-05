import { useNavigate } from 'react-router-dom'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent } from '@/shared/ui/card'
import type { TopicSearchResult } from '../types'

interface TopicSearchCardProps {
  result: TopicSearchResult
}

export const TopicSearchCard = ({ result }: TopicSearchCardProps) => {
  const navigate = useNavigate()
  const { topic, similarity_score } = result

  const formatSimilarity = (score: number) => {
    return `${Math.round(score * 100)}%`
  }

  const renderIcon = (icon: string | null) => {
    if (!icon) return <span className="text-2xl">📁</span>
    return <span className="text-2xl">{icon}</span>
  }

  const handleClick = () => {
    navigate(`/topics/${topic.id}`)
  }

  return (
    <Card
      className="transition-all hover:shadow-md hover:border-primary/50 cursor-pointer"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Topic: ${topic.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg" style={{ backgroundColor: topic.color || '#e5e7eb' }}>
            {renderIcon(topic.icon)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="font-semibold text-base">{topic.name}</h3>
              <Badge variant="outline" className="text-xs">
                {formatSimilarity(similarity_score)} match
              </Badge>
            </div>
            {topic.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {topic.description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
