import { Card } from '@/shared/ui/card'
import { ZoomableCard } from '@/shared/ui/zoomable-card'
import { TrendChart } from './TrendChart'
import { ActivityHeatmap } from './ActivityHeatmap'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/utils'
import type { MessageTrendPoint, ActivityDay } from '../types'

interface CommandCenterProps {
    greeting: string
    subtitle: string
    trendData?: MessageTrendPoint[]
    trendLoading?: boolean
    activityData?: ActivityDay[]
    activityLoading?: boolean
    activeSignalsCount?: number
    connectionStatus?: 'healthy' | 'warning' | 'error'
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
    greeting,
    subtitle,
    trendData,
    trendLoading,
    activityData,
    activityLoading,
    activeSignalsCount = 0,
    connectionStatus = 'healthy',
}) => {
    const { t } = useTranslation('dashboard')

    // Connection status indicator logic
    const isHealthy = connectionStatus === 'healthy'
    const dotClass = isHealthy ? 'bg-status-connected' : 'bg-status-error'
    const statusText = isHealthy
        ? t('activityHeatmap.compactTitle')
        : t('activityHeatmap.compactTitleError')
    return (
        <Card className="w-full min-h-[160px] flex flex-col md:flex-row overflow-hidden relative mb-8 animate-fade-in-up">
            {/* Left Section: Greeting & Status */}
            <div className="flex-1 p-6 flex flex-col justify-center relative z-dropdown">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tight mb-1">{greeting}</h1>
                    <p className="text-muted-foreground">{subtitle}</p>
                </div>

                {/* System Status Indicator - The "HUD" Element */}
                <div className="flex items-center gap-4">
                    <div className="relative flex items-center justify-center w-12 h-12">
                        {/* Glowing Ring */}
                        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-pulse-slow" />
                        <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin-slow opacity-60" />

                        {/* Icon/Number */}
                        <span className="text-lg font-bold text-primary">{activeSignalsCount}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold">{t('commandCenter.activeSignals')}</span>
                        <span className="text-xs text-primary">{t('commandCenter.systemStatus')}</span>
                    </div>
                </div>
            </div>

            {/* Right Section: Integrated Visualizations */}
            <div className="flex-[1.5] relative min-h-[200px] md:min-h-0 md:h-auto border-t md:border-t-0 md:border-l border-border/40">
                {/* Background Grid/Pattern for "High Tech" feel */}
                <div className="absolute inset-0 bg-grid-white/[0.02]" />

                {/* Trend Chart - Dominant Layer */}
                <div className="absolute inset-0 pb-12 pt-4 pr-0 cursor-pointer">
                    <ZoomableCard
                        trigger="click"
                        className="w-full h-full !cursor-pointer hover:bg-transparent"
                        preview={<TrendChart data={trendData} isLoading={trendLoading} embedded compact />}
                        full={
                            <div className="h-[400px] w-full p-6">
                                <TrendChart data={trendData} isLoading={trendLoading} />
                            </div>
                        }
                    />
                </div>

                {/* Activity Heatmap - Subtle Overlay at bottom right */}
                <div className="absolute bottom-4 right-4 z-dropdown bg-background/80 backdrop-blur-sm rounded-md border border-border/50 p-2 shadow-sm transition-transform hover:scale-105 cursor-pointer">
                    <ZoomableCard
                        trigger="click"
                        className="cursor-pointer"
                        preview={
                            <>
                                <div className="flex items-center gap-2 mb-1 px-1">
                                    <div className={cn('w-1.5 h-1.5 rounded-full animate-pulse', dotClass)} />
                                    <span className="text-[10px] font-medium text-muted-foreground tracking-wider">{statusText}</span>
                                </div>
                                <ActivityHeatmap data={activityData} isLoading={activityLoading} embedded compact />
                            </>
                        }
                        full={
                            <div className="h-[400px] w-full p-6 flex flex-col justify-center bg-card">
                                <ActivityHeatmap data={activityData} isLoading={activityLoading} />
                            </div>
                        }
                    />
                </div>

                {/* Fade overlays for smooth edges */}
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-card to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent pointer-events-none" />
            </div>
        </Card>
    )
}
