import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Label } from '@/shared/ui/label'
import { Progress } from '@/shared/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip'
import { toast } from 'sonner'
import type { MessageInspectData } from './types'

interface AtomsTabProps {
  data: MessageInspectData['atoms']
}

export function AtomsTab({ data }: AtomsTabProps) {
  const handleSearchEntity = (entity: string, type: string) => {
    toast.info('Search feature', {
      description: `Searching for messages with "${entity}" (${type}) - coming soon`,
    })
  }

  const handleSearchKeyword = (keyword: string) => {
    toast.info('Keyword search', {
      description: `Searching for messages with "${keyword}" - coming soon`,
    })
  }

  const hasEntities =
    data.entities.people.length > 0 ||
    data.entities.places.length > 0 ||
    data.entities.organizations.length > 0 ||
    data.entities.concepts.length > 0

  const hasKeywords = data.keywords.length > 0
  const hasEmbedding = data.embedding && data.embedding.length > 0

  const calculateVectorNorm = (): number => {
    if (!data.embedding || data.embedding.length === 0) return 0
    const sumOfSquares = data.embedding.reduce((sum, val) => sum + val * val, 0)
    return Math.sqrt(sumOfSquares)
  }

  const getTopDimensions = (count = 5): number[] => {
    if (!data.embedding || data.embedding.length === 0) return []
    return [...data.embedding]
      .sort((a, b) => Math.abs(b) - Math.abs(a))
      .slice(0, count)
  }

  const renderEntityCard = (
    title: string,
    entities: string[],
    type: string,
    colorClass: string
  ) => (
    <Card key={type}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription>
          {entities.length === 0
            ? `No ${type.toLowerCase()} detected`
            : `${entities.length} detected`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {entities.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No {type.toLowerCase()} found</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {entities.map((entity) => (
              <Badge
                key={entity}
                variant="secondary"
                onClick={() => handleSearchEntity(entity, type)}
                className={`cursor-pointer hover:opacity-80 transition-opacity ${colorClass}`}
              >
                {entity}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8 p-6">
      <section aria-labelledby="entities-heading">
        <h2 id="entities-heading" className="text-xl font-semibold mb-4">
          Extracted Entities
        </h2>

        {!hasEntities ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 text-center">
                No entities detected in this message
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderEntityCard(
              'People',
              data.entities.people,
              'People',
              'bg-blue-100 text-blue-800 hover:bg-blue-200'
            )}
            {renderEntityCard(
              'Places',
              data.entities.places,
              'Places',
              'bg-green-100 text-green-800 hover:bg-green-200'
            )}
            {renderEntityCard(
              'Organizations',
              data.entities.organizations,
              'Organizations',
              'bg-purple-100 text-purple-800 hover:bg-purple-200'
            )}
            {renderEntityCard(
              'Concepts',
              data.entities.concepts,
              'Concepts',
              'bg-orange-100 text-orange-800 hover:bg-orange-200'
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="keywords-heading">
        <h2 id="keywords-heading" className="text-xl font-semibold mb-4">
          Keywords
        </h2>

        {!hasKeywords ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 text-center">
                No keywords extracted from this message
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Extracted Keywords ({data.keywords.length})</CardTitle>
              <CardDescription>
                Sorted by relevance (larger = more relevant)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {data.keywords
                  .sort((a, b) => b.relevance - a.relevance)
                  .map((keyword) => {
                    const fontSize = 12 + (keyword.relevance / 100) * 12
                    return (
                      <TooltipProvider key={keyword.text}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              style={{ fontSize: `${fontSize}px` }}
                              onClick={() => handleSearchKeyword(keyword.text)}
                              className="cursor-pointer hover:bg-gray-100 transition-colors"
                            >
                              {keyword.text}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Relevance: {keyword.relevance}%</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      <section aria-labelledby="embeddings-heading">
        <h2 id="embeddings-heading" className="text-xl font-semibold mb-4">
          Semantic Similarity
        </h2>

        {!hasEmbedding ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 text-center">
                No embedding data available for this message
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Vector Embedding</CardTitle>
              <CardDescription>
                {data.embedding?.length || 0} dimensions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium">Vector Norm:</Label>
                <div className="mt-2">
                  <Progress value={calculateVectorNorm() * 100} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {calculateVectorNorm().toFixed(4)}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Top 5 Dimensions:</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {getTopDimensions(5).map((val, idx) => (
                    <Badge key={idx} variant="secondary" className="font-mono text-xs">
                      {val.toFixed(4)}
                    </Badge>
                  ))}
                </div>
              </div>

              {data.similarMessages && data.similarMessages.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">
                    Similar Messages (Top {data.similarMessages.length}):
                  </Label>
                  <div className="mt-2 space-y-2">
                    {data.similarMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() =>
                          toast.info('Message details', {
                            description: `Opening message ${msg.id} - coming soon`,
                          })
                        }
                      >
                        <span className="text-sm truncate flex-1 mr-4">
                          {msg.preview}
                        </span>
                        <Badge variant="default">
                          {(msg.similarity * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!data.similarMessages || data.similarMessages.length === 0) && (
                <div className="text-sm text-gray-500 text-center py-4 border rounded-lg bg-gray-50">
                  No similar messages found
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
