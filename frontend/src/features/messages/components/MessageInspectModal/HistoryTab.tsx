import type { MessageInspectData } from './types'

interface HistoryTabProps {
  data: MessageInspectData['history']
}

export function HistoryTab({ data }: HistoryTabProps) {
  return (
    <div className="space-y-4 p-4">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="mb-2 text-sm font-medium text-gray-700">
          Placeholder: Classification History
        </h3>
        <p className="text-sm text-gray-500">
          This tab will display a timeline of classification changes with diffs.
        </p>
        <div className="mt-4 space-y-2 text-xs text-gray-400">
          <div>History Events: {data.length}</div>
          {data.length > 0 && (
            <div>Last Action: {data[data.length - 1].action}</div>
          )}
        </div>
      </div>
    </div>
  )
}
