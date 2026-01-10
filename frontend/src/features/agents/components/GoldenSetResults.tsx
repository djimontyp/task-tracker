/**
 * GoldenSetResults Component
 *
 * Displays the results of Golden Set Testing for an agent.
 * Includes verdict banner with copy button, summary cards, and filterable results table.
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/shared/ui'
import { cn } from '@/shared/lib'
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Target,
  BarChart3,
  Copy,
} from 'lucide-react'
import type { GoldenSetTestReport, ScoringResult } from '../types'

export interface GoldenSetResultsProps {
  report: GoldenSetTestReport
}

type ResultFilter = 'all' | 'pass' | 'warning' | 'fail' | 'error'

const verdictConfig = {
  acceptable: {
    icon: CheckCircle,
    labelKey: 'goldenSetTest.results.verdict.acceptable',
    defaultLabel: 'Acceptable',
    className: 'bg-semantic-success/10 text-semantic-success border-semantic-success/20',
  },
  needs_improvement: {
    icon: AlertTriangle,
    labelKey: 'goldenSetTest.results.verdict.needsImprovement',
    defaultLabel: 'Needs Improvement',
    className: 'bg-semantic-warning/10 text-semantic-warning border-semantic-warning/20',
  },
  failed: {
    icon: XCircle,
    labelKey: 'goldenSetTest.results.verdict.failed',
    defaultLabel: 'Failed',
    className: 'bg-semantic-error/10 text-semantic-error border-semantic-error/20',
  },
} as const

const statusBadgeConfig = {
  pass: {
    className: 'bg-semantic-success/10 text-semantic-success border-semantic-success/20',
    labelKey: 'goldenSetTest.results.scoring.pass',
    defaultLabel: 'Pass',
  },
  warning: {
    className: 'bg-semantic-warning/10 text-semantic-warning border-semantic-warning/20',
    labelKey: 'goldenSetTest.results.scoring.warning',
    defaultLabel: 'Warning',
  },
  fail: {
    className: 'bg-semantic-error/10 text-semantic-error border-semantic-error/20',
    labelKey: 'goldenSetTest.results.scoring.fail',
    defaultLabel: 'Fail',
  },
  error: {
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    labelKey: 'goldenSetTest.results.scoring.error',
    defaultLabel: 'Error',
  },
} as const

function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

function truncateContent(content: string, maxLength: number = 50): string {
  if (content.length <= maxLength) return content
  return `${content.slice(0, maxLength)}...`
}

export function GoldenSetResults({ report }: GoldenSetResultsProps) {
  const { t } = useTranslation('agents')
  const [filter, setFilter] = useState<ResultFilter>('all')

  const verdict = verdictConfig[report.verdict]
  const VerdictIcon = verdict.icon

  const totalScoring = report.scoring_pass + report.scoring_warning + report.scoring_fail
  const totalClassification =
    report.classification_exact + report.classification_alt + report.classification_fail

  // Use all_results if available, fallback to failures
  const allResults = report.all_results ?? report.failures

  // Filter results based on selected tab
  const filteredResults = useMemo(() => {
    if (filter === 'all') return allResults
    return allResults.filter((result) => result.status === filter)
  }, [allResults, filter])

  // Count by status for tab labels
  const counts = useMemo(() => {
    return {
      all: allResults.length,
      pass: allResults.filter((r) => r.status === 'pass').length,
      warning: allResults.filter((r) => r.status === 'warning').length,
      fail: allResults.filter((r) => r.status === 'fail').length,
      error: allResults.filter((r) => r.status === 'error').length,
    }
  }, [allResults])

  const displayedResults = filteredResults.slice(0, 10)

  const handleCopyReport = async () => {
    await navigator.clipboard.writeText(JSON.stringify(report, null, 2))
    toast.success(t('goldenSetTest.results.copied', 'Report copied'))
  }

  return (
    <div className="space-y-6">
      {/* Verdict Banner */}
      <div
        className={cn(
          'flex items-center gap-4 rounded-lg border p-6',
          verdict.className
        )}
      >
        <VerdictIcon className="h-10 w-10" />
        <div className="flex-1">
          <h2 className="text-2xl font-bold">
            {t(verdict.labelKey, verdict.defaultLabel)}
          </h2>
          <p className="text-sm opacity-80">
            {t('goldenSetTest.results.testedMessages', {
              defaultValue: '{{count}} messages tested',
              count: report.total_messages,
            })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyReport}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            {t('goldenSetTest.results.copyReport', 'Copy Report')}
          </Button>
          <div className="text-right">
            <p className="text-sm opacity-80">
              {t('goldenSetTest.results.model', { defaultValue: 'Model' })}
            </p>
            <p className="font-mono text-sm">{report.model}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Scoring Card */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-muted-foreground" />
              {t('goldenSetTest.results.scoring.title', { defaultValue: 'Scoring' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t('goldenSetTest.results.scoring.pass', { defaultValue: 'Pass' })}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-semantic-success">
                  {report.scoring_pass}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatPercent(report.scoring_pass, totalScoring)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t('goldenSetTest.results.scoring.warning', { defaultValue: 'Warning' })}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-semantic-warning">
                  {report.scoring_warning}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatPercent(report.scoring_warning, totalScoring)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t('goldenSetTest.results.scoring.fail', { defaultValue: 'Fail' })}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-semantic-error">
                  {report.scoring_fail}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatPercent(report.scoring_fail, totalScoring)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Classification Card */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              {t('goldenSetTest.results.classification.title', { defaultValue: 'Classification' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t('goldenSetTest.results.classification.exact', { defaultValue: 'Exact' })}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-semantic-success">
                  {report.classification_exact}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatPercent(report.classification_exact, totalClassification)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t('goldenSetTest.results.classification.alternative', { defaultValue: 'Alt' })}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-semantic-warning">
                  {report.classification_alt}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatPercent(report.classification_alt, totalClassification)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t('goldenSetTest.results.classification.mismatch', { defaultValue: 'Fail' })}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-semantic-error">
                  {report.classification_fail}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatPercent(report.classification_fail, totalClassification)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Card */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {t('goldenSetTest.results.performance.title', { defaultValue: 'Performance' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t('goldenSetTest.results.performance.duration', { defaultValue: 'Duration' })}
              </span>
              <span className="text-2xl font-bold">
                {report.duration_seconds.toFixed(1)}s
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t('goldenSetTest.results.performance.avgDeviation', { defaultValue: 'Avg Deviation' })}
              </span>
              <span className="text-2xl font-bold">
                {report.avg_score_diff.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t('goldenSetTest.results.performance.maxDeviation', { defaultValue: 'Max Deviation' })}
              </span>
              <span className="text-2xl font-bold">
                {report.max_score_diff.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Table with Tabs */}
      {allResults.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">
              {t('goldenSetTest.results.table.title', {
                defaultValue: 'Results',
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as ResultFilter)}>
              <TabsList variant="pill" className="mb-4">
                <TabsTrigger value="all" variant="pill">
                  {t('goldenSetTest.results.tabs.all', 'All')} ({counts.all})
                </TabsTrigger>
                <TabsTrigger value="pass" variant="pill">
                  {t('goldenSetTest.results.tabs.pass', 'Pass')} ({counts.pass})
                </TabsTrigger>
                <TabsTrigger value="warning" variant="pill">
                  {t('goldenSetTest.results.tabs.warning', 'Warning')} ({counts.warning})
                </TabsTrigger>
                <TabsTrigger value="fail" variant="pill">
                  {t('goldenSetTest.results.tabs.fail', 'Fail')} ({counts.fail})
                </TabsTrigger>
                {counts.error > 0 && (
                  <TabsTrigger value="error" variant="pill">
                    {t('goldenSetTest.results.tabs.error', 'Error')} ({counts.error})
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value={filter} className="mt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {t('goldenSetTest.results.failures.content', { defaultValue: 'Content' })}
                      </TableHead>
                      <TableHead className="w-24 text-center">
                        {t('goldenSetTest.results.failures.expected', { defaultValue: 'Expected' })}
                      </TableHead>
                      <TableHead className="w-24 text-center">
                        {t('goldenSetTest.results.failures.actual', { defaultValue: 'Actual' })}
                      </TableHead>
                      <TableHead className="w-20 text-center">
                        {t('goldenSetTest.results.failures.diff', { defaultValue: 'Diff' })}
                      </TableHead>
                      <TableHead className="w-24 text-center">
                        {t('goldenSetTest.results.failures.status', { defaultValue: 'Status' })}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedResults.map((result: ScoringResult) => {
                      const statusConfig = statusBadgeConfig[result.status]
                      return (
                        <TableRow key={result.msg_id}>
                          <TableCell
                            className="max-w-xs truncate font-mono text-xs"
                            title={result.content}
                          >
                            {truncateContent(result.content)}
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {result.expected_score.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {result.actual_score !== null ? result.actual_score.toFixed(2) : '—'}
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-center font-mono',
                              result.score_diff > 0.2
                                ? 'text-semantic-error'
                                : result.score_diff > 0.1
                                  ? 'text-semantic-warning'
                                  : ''
                            )}
                          >
                            {result.score_diff > 0 ? '+' : ''}
                            {result.score_diff.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={cn('text-xs cursor-help', statusConfig.className)}
                              title={result.error_message || undefined}
                            >
                              {t(statusConfig.labelKey, statusConfig.defaultLabel)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                {filteredResults.length > 10 && (
                  <p className="mt-4 text-center text-sm text-muted-foreground">
                    {t('goldenSetTest.results.table.limitNote', {
                      defaultValue: 'Showing first 10 of {{total}} results',
                      total: filteredResults.length,
                    })}
                  </p>
                )}
                {filteredResults.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {t('goldenSetTest.results.table.noResults', {
                      defaultValue: 'No results in this category',
                    })}
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
