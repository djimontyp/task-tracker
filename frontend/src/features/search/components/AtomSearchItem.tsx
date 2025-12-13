import { Lightbulb, CheckCircle } from 'lucide-react'
import { CommandItem } from '@/shared/ui/command'
import { Badge } from '@/shared/ui/badge'
import { HighlightedText } from '../utils/highlightRenderer'
import type { FTSAtomResult, FTSAtomType } from '../types/fts'

interface AtomSearchItemProps {
  atom: FTSAtomResult
  onSelect?: () => void
}

const atomTypeColors: Record<FTSAtomType, string> = {
  problem: 'bg-semantic-error/10 text-destructive border-destructive/20',
  solution: 'bg-semantic-success/10 text-status-connected border-status-connected/20',
  decision: 'bg-semantic-info/10 text-primary border-primary/20',
  question: 'bg-semantic-warning/10 text-status-validating border-status-validating/20',
  insight: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  pattern: 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
  requirement: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
}

export function AtomSearchItem({ atom, onSelect }: AtomSearchItemProps) {
  return (
    <CommandItem
      value={`atom-${atom.id}`}
      onSelect={onSelect}
      className="flex items-start gap-2 px-2 py-2 cursor-pointer"
    >
      <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{atom.title}</span>
          {atom.user_approved && (
            <CheckCircle className="h-3.5 w-3.5 text-status-connected shrink-0" />
          )}
        </div>
        <HighlightedText
          html={atom.content_snippet}
          className="text-xs text-muted-foreground line-clamp-1 [&>mark]:bg-yellow-200 [&>mark]:dark:bg-yellow-800 [&>mark]:px-0.5 [&>mark]:rounded"
        />
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${atomTypeColors[atom.type]}`}>
          {atom.type}
        </Badge>
      </div>
    </CommandItem>
  )
}
