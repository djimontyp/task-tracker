import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RotateCw, Home } from 'lucide-react'
import { logger } from '@/shared/utils/logger'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * Global Error Boundary to catch React errors and prevent full app crashes
 * Provides user-friendly error UI with retry and navigation options
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // TODO: Send to error tracking service (Sentry, Bugsnag, etc.)
    // Example: Sentry.captureException(error, { extra: errorInfo })
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleGoHome = (): void => {
    window.location.href = '/dashboard'
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertTriangle className="h-12 w-12 text-destructive" aria-hidden="true" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Oops! Something went wrong
              </h1>
              <p className="text-muted-foreground">
                We encountered an unexpected error. Don&apos;t worry, we&apos;ve logged it and will look into it.
              </p>
            </div>

            {import.meta.env.MODE === 'development' && this.state.error && (
              <details className="text-left bg-muted/50 rounded-lg p-4 border border-border">
                <summary className="cursor-pointer font-semibold text-sm text-foreground hover:text-primary transition-colors">
                  Error Details (Development Only)
                </summary>
                <div className="mt-4 space-y-2 text-xs font-mono">
                  <div>
                    <strong className="text-destructive">Error:</strong>
                    <pre className="mt-2 overflow-auto bg-background p-2 rounded border border-border text-muted-foreground">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong className="text-destructive">Component Stack:</strong>
                      <pre className="mt-2 overflow-auto bg-background p-2 rounded border border-border text-muted-foreground max-h-48">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={this.handleRetry}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Retry the previous action"
              >
                <RotateCw className="h-4 w-4" aria-hidden="true" />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md font-medium hover:bg-secondary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Go back to home page"
              >
                <Home className="h-4 w-4" aria-hidden="true" />
                Go Home
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              If this problem persists, please contact support or refresh the page.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
