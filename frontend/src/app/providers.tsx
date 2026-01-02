import { ReactNode, useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { onLCP, onINP, onCLS, onFCP, onTTFB, type Metric } from 'web-vitals'
import { ThemeProvider } from '@/shared/components/ThemeProvider'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { WebSocketProvider } from '@/shared/providers/WebSocketProvider'
import { logger } from '@/shared/utils/logger'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes - prevents memory leaks
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
})

/**
 * Initialize Web Vitals tracking at app startup
 * Logs metrics to console in development, future-ready for analytics
 */
const initWebVitals = () => {
  const sendToAnalytics = (metric: Metric) => {
    logger.debug(`[WebVitals] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);

    // Future: Send to analytics service
    // vercelAnalytics.track(metric.name, { value: metric.value });
    // datadogRum.addTiming(metric.name, metric.value);
  };

  onLCP(sendToAnalytics);
  onINP(sendToAnalytics);
  onCLS(sendToAnalytics);
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
};

interface ProvidersProps {
  children: ReactNode
}

export const Providers = ({ children }: ProvidersProps) => {
  useEffect(() => {
    initWebVitals();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <WebSocketProvider>
            <TooltipProvider delayDuration={300}>
              {children}
            </TooltipProvider>
          </WebSocketProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}