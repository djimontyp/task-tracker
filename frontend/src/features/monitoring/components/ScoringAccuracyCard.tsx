import { useQuery } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { monitoringService } from '../api/monitoringService'

export const ScoringAccuracyCard = () => {
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
            Точність класифікації
          </CardTitle>
          <CardDescription>Метрики якості системи оцінки важливості повідомлень</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            Завантаження метрик...
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
            Точність класифікації
          </CardTitle>
          <CardDescription>Метрики якості системи оцінки важливості повідомлень</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <div className="text-destructive mb-2">Помилка завантаження метрик</div>
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <CardTitle>Точність класифікації</CardTitle>
          </div>
          {isHealthy ? (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Норма
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              Потребує уваги
            </Badge>
          )}
        </div>
        <CardDescription>
          Валідовано на {data.total_samples} зразках
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold mb-1">{accuracyPercentage}%</div>
            <div className="text-sm text-muted-foreground">Загальна точність</div>
          </div>

          <div className="space-y-3">
            {data.category_metrics.map((metric) => {
              const categoryLabels: Record<string, string> = {
                noise: 'Шум',
                weak_signal: 'Слабкий сигнал',
                signal: 'Сигнал',
              }

              return (
                <div key={metric.category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{categoryLabels[metric.category] || metric.category}</span>
                    <span className="text-muted-foreground">{metric.support} зразків</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 bg-muted rounded-md text-center">
                      <div className="font-medium">{(metric.precision * 100).toFixed(1)}%</div>
                      <div className="text-muted-foreground">Precision</div>
                    </div>
                    <div className="p-2 bg-muted rounded-md text-center">
                      <div className="font-medium">{(metric.recall * 100).toFixed(1)}%</div>
                      <div className="text-muted-foreground">Recall</div>
                    </div>
                    <div className="p-2 bg-muted rounded-md text-center">
                      <div className="font-medium">{(metric.f1_score * 100).toFixed(1)}%</div>
                      <div className="text-muted-foreground">F1 Score</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {!isHealthy && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium text-destructive mb-1">
                    Точність нижче порогу 80%
                  </div>
                  <div className="text-muted-foreground">
                    Рекомендується перевірити систему оцінки важливості та валідаційний датасет
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center">
            Оновлено: {new Date(data.generated_at).toLocaleString('uk-UA')}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
