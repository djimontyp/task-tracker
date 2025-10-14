/**
 * ConfusionMatrixHeatmap Component
 */

interface ConfusionMatrixHeatmapProps {
  matrix: Record<string, Record<string, number>>
}

const ConfusionMatrixHeatmap = ({ matrix }: ConfusionMatrixHeatmapProps) => {
  const topics = Object.keys(matrix).sort()

  if (topics.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No data to display confusion matrix
      </div>
    )
  }

  const allCounts = topics.flatMap(actual =>
    topics.map(predicted => matrix[actual]?.[predicted] || 0)
  )
  const maxCount = Math.max(...allCounts, 1)

  const getColorIntensity = (count: number) => {
    const intensity = count / maxCount
    if (count === 0) return 'bg-muted'

    if (intensity >= 0.8) return 'bg-green-600'
    if (intensity >= 0.6) return 'bg-green-500'
    if (intensity >= 0.4) return 'bg-green-400'
    if (intensity >= 0.2) return 'bg-green-300'
    return 'bg-green-200'
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Confusion Matrix</h4>
          <p className="text-xs text-muted-foreground">
            Rows are actual topics, columns are predicted topics
          </p>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border bg-muted p-2 text-left text-xs font-medium min-w-[120px]">
                  Actual / Predicted
                </th>
                {topics.map((topic) => (
                  <th
                    key={topic}
                    className="border bg-muted p-2 text-center text-xs font-medium min-w-[80px]"
                  >
                    <div className="truncate" title={topic}>
                      {topic}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topics.map((actualTopic) => (
                <tr key={actualTopic}>
                  <td className="border bg-muted p-2 text-xs font-medium">
                    <div className="truncate" title={actualTopic}>
                      {actualTopic}
                    </div>
                  </td>
                  {topics.map((predictedTopic) => {
                    const count = matrix[actualTopic]?.[predictedTopic] || 0
                    const isCorrect = actualTopic === predictedTopic

                    return (
                      <td
                        key={predictedTopic}
                        className={`border p-2 text-center text-sm font-medium ${getColorIntensity(count)} ${
                          isCorrect ? 'ring-2 ring-inset ring-blue-500' : ''
                        }`}
                        title={`${actualTopic} → ${predictedTopic}: ${count}`}
                      >
                        {count > 0 ? count : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 rounded" />
            <span>Correct classification</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded" />
            <span>High count</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-200 rounded" />
            <span>Low count</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfusionMatrixHeatmap
