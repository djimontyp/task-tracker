import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, CheckCircle, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { monitoringService } from '../api/monitoringService'

export const ScoringAccuracyCard = () => {
  const { t, i18n } = useTranslation('monitoring')
  const { data, isLoading, error } = useQuery({
    queryKey: ['monitoring', 'scoring-accuracy'],
    queryFn: () => monitoringService.fetchScoringAccuracy(),
    refetchInterval: 300000,
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('scoringAccuracy.title')}
          </CardTitle>
          <CardDescription>{t('scoringAccuracy.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            {t('scoringAccuracy.loading')}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('scoringAccuracy.title')}
          </CardTitle>
          <CardDescription>{t('scoringAccuracy.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <div className="text-destructive mb-2">{t('scoringAccuracy.error.title')}</div>
            <div className="text-sm text-muted-foreground">{String(error)}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  const accuracyPercentage = (data.overall_accuracy * 100).toFixed(1)
  const isHealthy = !data.alert_threshold_met

  const getCategoryLabel = (category: string): string => {
    const categoryKeys: Record<string, string> = {
      noise: 'scoringAccuracy.categories.noise',
      weak_signal: 'scoringAccuracy.categories.weakSignal',
      signal: 'scoringAccuracy.categories.signal',
    }
    return categoryKeys[category] ? t(categoryKeys[category]) : category
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <CardTitle>{t('scoringAccuracy.title')}</CardTitle>
          </div>
          {isHealthy ? (
            <Badge variant="default" className="bg-semantic-success hover:bg-semantic-success/90">
              <CheckCircle className="h-3 w-3 mr-2" />
              {t('scoringAccuracy.status.healthy')}
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-2" />
              {t('scoringAccuracy.status.alert')}
            </Badge>
          )}
        </div>
        <CardDescription>
          {t('scoringAccuracy.validatedOn', { count: data.total_samples })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{accuracyPercentage}%</div>
            <div className="text-sm text-muted-foreground">{t('scoringAccuracy.overallAccuracy')}</div>
          </div>

          <div className="space-y-4">
            {data.category_metrics.map((metric) => (
              <div key={metric.category} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{getCategoryLabel(metric.category)}</span>
                  <span className="text-muted-foreground">
                    {t('scoringAccuracy.metrics.samples', { count: metric.support })}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-muted rounded-md text-center">
                    <div className="font-medium">{(metric.precision * 100).toFixed(1)}%</div>
                    <div className="text-muted-foreground">{t('scoringAccuracy.metrics.precision')}</div>
                  </div>
                  <div className="p-2 bg-muted rounded-md text-center">
                    <div className="font-medium">{(metric.recall * 100).toFixed(1)}%</div>
                    <div className="text-muted-foreground">{t('scoringAccuracy.metrics.recall')}</div>
                  </div>
                  <div className="p-2 bg-muted rounded-md text-center">
                    <div className="font-medium">{(metric.f1_score * 100).toFixed(1)}%</div>
                    <div className="text-muted-foreground">{t('scoringAccuracy.metrics.f1Score')}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!isHealthy && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium text-destructive mb-2">
                    {t('scoringAccuracy.alert.title')}
                  </div>
                  <div className="text-muted-foreground">
                    {t('scoringAccuracy.alert.description')}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center">
            {t('scoringAccuracy.updated', {
              date: new Date(data.generated_at).toLocaleString(i18n.language === 'uk' ? 'uk-UA' : 'en-US'),
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
