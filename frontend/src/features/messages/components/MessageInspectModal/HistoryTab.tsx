import type { MessageInspectData } from './types'

interface HistoryTabProps {
  data: MessageInspectData['history']
}

export function HistoryTab({ data }: HistoryTabProps) {
  return (
    <div className="space-y-4 p-4">
      <div className="rounded-lg border border-border bg-muted p-4">
        <h3 className="mb-2 text-sm font-medium text-foreground">
          Placeholder: Classification History
        </h3>
        <p className="text-sm text-muted-foreground">
          This tab will display a timeline of classification changes with diffs.
        </p>
        <div className="mt-4 space-y-2 text-xs text-muted-foreground">
          <div>History Events: {data.length}</div>
          {data.length > 0 && (
            <div>Last Action: {data[data.length - 1].action}</div>
          )}
        </div>
      </div>
    </div>
  )
}
