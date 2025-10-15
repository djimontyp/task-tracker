import { sourcePlugins } from '../plugins/registry'

const SourcesTab = () => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Data Sources</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure integrations and data sources for your task tracking system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sourcePlugins.map((plugin) => {
          const CardComponent = plugin.CardComponent
          return <CardComponent key={plugin.id} />
        })}
      </div>
    </div>
  )
}

export default SourcesTab
