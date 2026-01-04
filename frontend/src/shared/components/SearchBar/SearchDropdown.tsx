import { SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandList,
  CommandSeparator,
} from '@/shared/ui/command'
import { Skeleton } from '@/shared/ui/skeleton'
import { MessageSearchItem } from './MessageSearchItem'
import { AtomSearchItem } from './AtomSearchItem'
import { TopicSearchItem } from './TopicSearchItem'
import type { FTSSearchResultsResponse } from './types/fts'

interface SearchDropdownProps {
  data: FTSSearchResultsResponse | undefined
  isLoading: boolean
  isDebouncing: boolean
  query: string
  onSelectMessage?: (id: string) => void
  onSelectAtom?: (id: string) => void
  onSelectTopic?: (id: string) => void
}

export function SearchDropdown({
  data,
  isLoading,
  isDebouncing,
  query,
  onSelectMessage,
  onSelectAtom,
  onSelectTopic,
}: SearchDropdownProps) {
  const { t } = useTranslation('common')
  const showLoading = isLoading || isDebouncing
  const hasResults = data && data.total_results > 0
  const hasNoResults = data && data.total_results === 0 && !showLoading

  return (
    <Command className="rounded-lg border shadow-md" shouldFilter={false}>
      <CommandList className="max-h-[400px]">
        {/* Loading State with Skeleton */}
        {showLoading && (
          <div className="p-2 space-y-4">
            {/* Messages skeleton group */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              {[1, 2].map((i) => (
                <div key={`msg-${i}`} className="flex items-start gap-2 px-2 py-2">
                  <Skeleton className="h-4 w-4 rounded shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
            {/* Atoms skeleton group */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              {[1, 2].map((i) => (
                <div key={`atom-${i}`} className="flex items-start gap-2 px-2 py-2">
                  <Skeleton className="h-4 w-4 rounded shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {hasNoResults && (
          <CommandEmpty className="py-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <SearchX className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">{t('searchDropdown.noResultsFor', { query })}</p>
              <p className="text-xs text-muted-foreground">
                {t('searchDropdown.tryBroaderKeywords')}
              </p>
            </div>
          </CommandEmpty>
        )}

        {/* Results */}
        {hasResults && !showLoading && (
          <>
            {/* Messages */}
            {data.messages.length > 0 && (
              <CommandGroup heading={t('searchDropdown.messages', { count: data.messages.length })}>
                {data.messages.map((message) => (
                  <MessageSearchItem
                    key={message.id}
                    message={message}
                    onSelect={() => onSelectMessage?.(message.id)}
                  />
                ))}
              </CommandGroup>
            )}

            {/* Atoms */}
            {data.atoms.length > 0 && (
              <>
                {data.messages.length > 0 && <CommandSeparator />}
                <CommandGroup heading={t('searchDropdown.atoms', { count: data.atoms.length })}>
                  {data.atoms.map((atom) => (
                    <AtomSearchItem
                      key={atom.id}
                      atom={atom}
                      onSelect={() => onSelectAtom?.(atom.id)}
                    />
                  ))}
                </CommandGroup>
              </>
            )}

            {/* Topics */}
            {data.topics.length > 0 && (
              <>
                {(data.messages.length > 0 || data.atoms.length > 0) && <CommandSeparator />}
                <CommandGroup heading={t('searchDropdown.topics', { count: data.topics.length })}>
                  {data.topics.map((topic) => (
                    <TopicSearchItem
                      key={topic.id}
                      topic={topic}
                      onSelect={() => onSelectTopic?.(topic.id)}
                    />
                  ))}
                </CommandGroup>
              </>
            )}
          </>
        )}
      </CommandList>
    </Command>
  )
}
