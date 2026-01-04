import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('messages')
  const handleSearchEntity = (entity: string, type: string) => {
    toast.info(t('atomsTab.toast.searchFeature'), {
      description: t('atomsTab.toast.searchEntityDescription', { entity, type }),
    })
  }

  const handleSearchKeyword = (keyword: string) => {
    toast.info(t('atomsTab.toast.keywordSearch'), {
      description: t('atomsTab.toast.searchKeywordDescription', { keyword }),
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
    titleKey: string,
    entities: string[],
    type: string,
    colorClass: string
  ) => (
    <Card key={type}>
      <CardHeader>
        <CardTitle className="font-semibold">{t(titleKey)}</CardTitle>
        <CardDescription>
          {entities.length === 0
            ? t('atomsTab.entities.noneDetected', { type: t(`atomsTab.entities.types.${type.toLowerCase()}`) })
            : t('atomsTab.entities.detected', { count: entities.length })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {entities.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">{t('atomsTab.entities.noneFound', { type: t(`atomsTab.entities.types.${type.toLowerCase()}`) })}</p>
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
          {t('atomsTab.extractedEntities')}
        </h2>

        {!hasEntities ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">
                {t('atomsTab.noEntitiesDetected')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderEntityCard(
              'atomsTab.entities.people',
              data.entities.people,
              'People',
              'bg-semantic-info/10 text-semantic-info hover:bg-semantic-info/20'
            )}
            {renderEntityCard(
              'atomsTab.entities.places',
              data.entities.places,
              'Places',
              'bg-semantic-success/10 text-semantic-success hover:bg-semantic-success/20'
            )}
            {renderEntityCard(
              'atomsTab.entities.organizations',
              data.entities.organizations,
              'Organizations',
              'bg-accent/10 text-accent-foreground hover:bg-accent/20'
            )}
            {renderEntityCard(
              'atomsTab.entities.concepts',
              data.entities.concepts,
              'Concepts',
              'bg-semantic-warning/10 text-semantic-warning hover:bg-semantic-warning/20'
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="keywords-heading">
        <h2 id="keywords-heading" className="text-xl font-semibold mb-4">
          {t('atomsTab.keywords.title')}
        </h2>

        {!hasKeywords ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">
                {t('atomsTab.keywords.noKeywords')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t('atomsTab.keywords.extracted', { count: data.keywords.length })}</CardTitle>
              <CardDescription>
                {t('atomsTab.keywords.sortedByRelevance')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
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
                              className="cursor-pointer hover:bg-muted transition-colors"
                            >
                              {keyword.text}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('atomsTab.keywords.relevance', { value: keyword.relevance })}</p>
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
          {t('atomsTab.semanticSimilarity.title')}
        </h2>

        {!hasEmbedding ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">
                {t('atomsTab.semanticSimilarity.noEmbedding')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t('atomsTab.semanticSimilarity.vectorEmbedding')}</CardTitle>
              <CardDescription>
                {t('atomsTab.semanticSimilarity.dimensions', { count: data.embedding?.length || 0 })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium">{t('atomsTab.semanticSimilarity.vectorNorm')}</Label>
                <div className="mt-2">
                  <Progress value={calculateVectorNorm() * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {calculateVectorNorm().toFixed(4)}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">{t('atomsTab.semanticSimilarity.topDimensions')}</Label>
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
                    {t('atomsTab.semanticSimilarity.similarMessages', { count: data.similarMessages.length })}
                  </Label>
                  <div className="mt-2 space-y-2">
                    {data.similarMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() =>
                          toast.info(t('atomsTab.toast.messageDetails'), {
                            description: t('atomsTab.toast.openingMessage', { id: msg.id }),
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
                <div className="text-sm text-muted-foreground text-center py-4 border rounded-lg bg-muted">
                  {t('atomsTab.semanticSimilarity.noSimilarMessages')}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
