import React, { Component, ReactNode } from 'react'
import { withTranslation, WithTranslation } from 'react-i18next'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { logger } from '@/shared/utils/logger'
import { Card, CardContent } from '@/shared/ui/card'

interface MessagesErrorBoundaryProps extends WithTranslation {
  children: ReactNode
}

interface MessagesErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class MessagesErrorBoundaryClass extends Component<
  MessagesErrorBoundaryProps,
  MessagesErrorBoundaryState
> {
  constructor(props: MessagesErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<MessagesErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('MessagesErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render(): ReactNode {
    const { t } = this.props

    if (this.state.hasError) {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {t('errorBoundary.title')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('errorBoundary.description')}
                </p>
              </div>

              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={t('errorBoundary.retryAriaLabel')}
              >
                <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                {t('errorBoundary.tryAgain')}
              </button>

              {import.meta.env.MODE === 'development' && this.state.error && (
                <details className="text-left bg-muted/50 rounded-lg p-4 border border-border text-xs w-full">
                  <summary className="cursor-pointer font-semibold text-foreground hover:text-primary transition-colors">
                    {t('errorBoundary.errorDetails')}
                  </summary>
                  <pre className="mt-2 overflow-auto text-[10px] font-mono text-muted-foreground">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

export const MessagesErrorBoundary = withTranslation('messages')(MessagesErrorBoundaryClass)
