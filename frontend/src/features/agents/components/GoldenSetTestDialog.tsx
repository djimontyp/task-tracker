/**
 * Golden Set Test Dialog Component
 *
 * Modal dialog for running Golden Set Tests against an agent.
 * Provides mode selection (quick/medium), progress tracking,
 * and displays results using GoldenSetResults component.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Label,
  Spinner,
} from '@/shared/ui'
import { FileCheck, Play, Clock, Zap } from 'lucide-react'
import { cn } from '@/shared/lib'
import { agentService } from '../api/agentService'
import { GoldenSetResults } from './GoldenSetResults'
import type { AgentConfig, GoldenSetTestReport } from '../types'

interface GoldenSetTestDialogProps {
  agent: AgentConfig
  open: boolean
  onOpenChange: (open: boolean) => void
}

type TestMode = 'quick' | 'medium'

const modeConfig: Record<
  TestMode,
  {
    labelKey: string
    defaultLabel: string
    descriptionKey: string
    defaultDescription: string
    messageCount: number
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  quick: {
    labelKey: 'goldenSetTest.modes.quick.label',
    defaultLabel: 'Quick',
    descriptionKey: 'goldenSetTest.modes.quick.description',
    defaultDescription: '30 messages - faster results',
    messageCount: 30,
    icon: Zap,
  },
  medium: {
    labelKey: 'goldenSetTest.modes.medium.label',
    defaultLabel: 'Medium',
    descriptionKey: 'goldenSetTest.modes.medium.description',
    defaultDescription: '50 messages - more thorough',
    messageCount: 50,
    icon: Clock,
  },
}

function GoldenSetTestDialog({
  agent,
  open,
  onOpenChange,
}: GoldenSetTestDialogProps) {
  const { t } = useTranslation('agents')

  // State
  const [mode, setMode] = useState<TestMode>('quick')
  const [report, setReport] = useState<GoldenSetTestReport | null>(null)

  // Mutation for running the test
  const testMutation = useMutation({
    mutationFn: (selectedMode: TestMode) =>
      agentService.runGoldenSetTest(agent.id, selectedMode),
    onSuccess: (data) => {
      setReport(data)
      toast.success(
        t('goldenSetTest.toast.success', {
          defaultValue: 'Golden Set Test completed',
        })
      )
    },
    onError: (error: Error) => {
      toast.error(
        error.message ||
          t('goldenSetTest.toast.error', {
            defaultValue: 'Failed to run Golden Set Test',
          })
      )
    },
  })

  const handleRunTest = () => {
    setReport(null)
    testMutation.mutate(mode)
  }

  const handleClose = () => {
    // Only allow closing if not running
    if (!testMutation.isPending) {
      setReport(null)
      onOpenChange(false)
    }
  }

  const handleReset = () => {
    setReport(null)
    testMutation.reset()
  }

  const isRunning = testMutation.isPending
  const hasResults = report !== null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          'w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] overflow-y-auto',
          hasResults ? 'md:max-w-4xl' : 'md:max-w-lg'
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            {t('goldenSetTest.title', {
              defaultValue: 'Golden Set Test: {{name}}',
              name: agent.name,
            })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mode Selection - only show before test starts */}
          {!isRunning && !hasResults && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('goldenSetTest.description', {
                  defaultValue:
                    'Test agent scoring accuracy against a curated set of messages with known expected scores.',
                })}
              </p>

              <div className="space-y-2">
                <Label className="text-base font-medium">
                  {t('goldenSetTest.selectMode', {
                    defaultValue: 'Select test mode',
                  })}
                </Label>
                <RadioGroup
                  value={mode}
                  onValueChange={(value: TestMode) => setMode(value)}
                  className="grid grid-cols-1 gap-4 md:grid-cols-2"
                >
                  {(Object.keys(modeConfig) as TestMode[]).map((modeKey) => {
                    const config = modeConfig[modeKey]
                    const ModeIcon = config.icon
                    return (
                      <Label
                        key={modeKey}
                        htmlFor={`mode-${modeKey}`}
                        className={cn(
                          'flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50',
                          mode === modeKey && 'border-primary bg-primary/5'
                        )}
                      >
                        <RadioGroupItem
                          value={modeKey}
                          id={`mode-${modeKey}`}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <ModeIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {t(config.labelKey, config.defaultLabel)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              ({t('goldenSetTest.modes.messageCount', {
                                defaultValue: '{{count}} messages',
                                count: config.messageCount,
                              })})
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t(config.descriptionKey, config.defaultDescription)}
                          </p>
                        </div>
                      </Label>
                    )
                  })}
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Running State */}
          {isRunning && (
            <div className="flex flex-col items-center gap-6 py-8">
              <Spinner className="h-12 w-12" />
              <div className="space-y-2 text-center">
                <p className="font-medium">
                  {t('goldenSetTest.running.title', {
                    defaultValue: 'Running Golden Set Test...',
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('goldenSetTest.running.description', {
                    defaultValue:
                      'Testing {{count}} messages. This may take a few minutes.',
                    count: modeConfig[mode].messageCount,
                  })}
                </p>
              </div>
              <Progress
                value={0}
                className="w-full max-w-xs animate-pulse"
              />
              <p className="text-xs text-muted-foreground">
                {t('goldenSetTest.running.doNotClose', {
                  defaultValue: 'Please do not close this dialog',
                })}
              </p>
            </div>
          )}

          {/* Results */}
          {hasResults && <GoldenSetResults report={report} />}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {!hasResults && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isRunning}
              >
                {t('goldenSetTest.actions.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button
                type="button"
                onClick={handleRunTest}
                disabled={isRunning}
                className="min-w-[140px]"
              >
                {isRunning ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    {t('goldenSetTest.actions.running', {
                      defaultValue: 'Running...',
                    })}
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    {t('goldenSetTest.actions.runTest', {
                      defaultValue: 'Run Test',
                    })}
                  </>
                )}
              </Button>
            </>
          )}
          {hasResults && (
            <>
              <Button type="button" variant="outline" onClick={handleReset}>
                {t('goldenSetTest.actions.runAgain', {
                  defaultValue: 'Run Again',
                })}
              </Button>
              <Button type="button" onClick={handleClose}>
                {t('goldenSetTest.actions.close', { defaultValue: 'Close' })}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { GoldenSetTestDialog }
