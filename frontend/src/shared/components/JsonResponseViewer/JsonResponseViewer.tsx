import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/shared/ui'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { highlightJson, tryFormatJson } from './highlightJson'

interface JsonResponseViewerProps {
  /**
   * The response string to display (may be JSON or plain text)
   */
  response: string
  /**
   * Maximum height of the scrollable container
   * @default "300px"
   */
  maxHeight?: string
}

/**
 * Smart JSON response viewer component
 * - Detects if response is valid JSON
 * - Shows syntax-highlighted JSON if valid
 * - Shows warning banner + plain text if not JSON
 */
export function JsonResponseViewer({ response, maxHeight = '300px' }: JsonResponseViewerProps) {
  const { t } = useTranslation('agents')

  const result = useMemo(() => tryFormatJson(response), [response])

  const isJson = result.isValid

  return (
    <div className="space-y-2">
      {/* Header with badge */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{t('testDialog.results.response')}</span>
        {isJson ? (
          <Badge variant="default" className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3" />
            {t('testDialog.results.jsonValid')}
          </Badge>
        ) : (
          <Badge variant="secondary" className="flex items-center gap-1.5 bg-semantic-warning/10 text-semantic-warning border-semantic-warning/20">
            <AlertCircle className="h-3 w-3" />
            {t('testDialog.results.textOnly')}
          </Badge>
        )}
      </div>

      {/* Warning banner for non-JSON responses */}
      {!isJson && (
        <div className="flex items-center gap-2 rounded-md border border-semantic-warning/20 bg-semantic-warning/5 px-3 py-2 text-xs text-semantic-warning">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{t('testDialog.results.expectedJson')}</span>
        </div>
      )}

      {/* Response content */}
      <div
        className="overflow-y-auto rounded-md border border-input bg-muted/50 px-4 py-2"
        style={{ maxHeight }}
      >
        {isJson ? (
          <pre
            className="text-sm font-mono"
            dangerouslySetInnerHTML={{
              __html: highlightJson(result.formatted),
            }}
          />
        ) : (
          <pre className="text-sm whitespace-pre-wrap break-words">{response}</pre>
        )}
      </div>
    </div>
  )
}
