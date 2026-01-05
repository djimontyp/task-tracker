import { useTranslation } from 'react-i18next'
import { Badge } from '@/shared/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip'
import { toast } from 'sonner'
import type { MessageInspectData } from '@/features/messages/types'
import { Hash, MapPin, Building, Users, Lightbulb } from 'lucide-react'

interface AtomsTabProps {
  data: MessageInspectData['atoms']
}

export function AtomsTab({ data }: AtomsTabProps) {
  const { t } = useTranslation('messages')

  const handleSearchEntity = (entity: string, type: string) => {
    toast.info(t('atomsTab.toast.searchFeature'), {
      description: t('atomsTab.toast.searchEntityDescription', { entity, type }),
    })
  }

  const hasEntities =
    data.entities.people.length > 0 ||
    data.entities.places.length > 0 ||
    data.entities.organizations.length > 0 ||
    data.entities.concepts.length > 0

  const hasKeywords = data.keywords.length > 0

  if (!hasEntities && !hasKeywords) {
    return <div className="text-xs text-muted-foreground italic">No linked atoms found.</div>
  }

  const renderEntityGroup = (
    entities: string[],
    type: string,
    colorClass: string,
    Icon: React.ElementType
  ) => {
    if (entities.length === 0) return null
    return (
      <div className="mb-3 last:mb-0">
        <div className="flex flex-wrap gap-1.5">
          {entities.map(entity => (
            <Badge
              key={entity}
              variant="secondary"
              className={`text-[10px] px-1.5 py-0.5 font-normal cursor-pointer hover:opacity-80 gap-1 ${colorClass}`}
              onClick={() => handleSearchEntity(entity, type)}
            >
              <Icon className="w-3 h-3 opacity-70" /> {entity}
            </Badge>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Entities */}
      {hasEntities && (
        <div className="space-y-2">
          {renderEntityGroup(data.entities.people, 'People', 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20', Users)}
          {renderEntityGroup(data.entities.places, 'Places', 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/20', MapPin)}
          {renderEntityGroup(data.entities.organizations, 'Orgs', 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20', Building)}
          {renderEntityGroup(data.entities.concepts, 'Concepts', 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 hover:bg-purple-500/20', Lightbulb)}
        </div>
      )}

      {/* Keywords */}
      {hasKeywords && (
        <div className="pt-2 border-t border-border/50">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-2 block">Keywords</span>
          <div className="flex flex-wrap gap-1.5">
            {data.keywords
              .sort((a, b) => b.relevance - a.relevance)
              .slice(0, 8) // Limit keywords to top 8 to avoid clutter
              .map((keyword) => (
                <TooltipProvider key={keyword.text}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 border-dashed text-muted-foreground hover:bg-muted cursor-help"
                      >
                        {keyword.text}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Relevance: {keyword.relevance}%</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
