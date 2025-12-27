import { Lightbulb, CheckCircle } from 'lucide-react'
import { CommandItem } from '@/shared/ui/command'
import { Badge } from '@/shared/ui/badge'
import { HighlightedText } from './utils/highlightRenderer'
import type { FTSAtomResult, FTSAtomType } from './types/fts'

interface AtomSearchItemProps {
  atom: FTSAtomResult
  onSelect?: () => void
}

const atomTypeColors: Record<FTSAtomType, string> = {
  problem: 'bg-atom-problem/10 text-atom-problem border-atom-problem/20',
  solution: 'bg-atom-solution/10 text-atom-solution border-atom-solution/20',
  decision: 'bg-atom-decision/10 text-atom-decision border-atom-decision/20',
  question: 'bg-atom-question/10 text-atom-question border-atom-question/20',
  insight: 'bg-atom-insight/10 text-atom-insight border-atom-insight/20',
  pattern: 'bg-atom-pattern/10 text-atom-pattern border-atom-pattern/20',
  requirement: 'bg-atom-requirement/10 text-atom-requirement border-atom-requirement/20',
}

export function AtomSearchItem({ atom, onSelect }: AtomSearchItemProps) {
  return (
    <CommandItem
      value={`atom-${atom.id}`}
      onSelect={onSelect}
      className="flex items-start gap-2 px-2 py-2 cursor-pointer"
    >
      <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{atom.title}</span>
          {atom.user_approved && (
            <CheckCircle className="h-3.5 w-3.5 text-status-connected shrink-0" />
          )}
        </div>
        <HighlightedText
          html={atom.content_snippet}
          className="text-xs text-muted-foreground line-clamp-1 [&>mark]:bg-highlight [&>mark]:px-0.5 [&>mark]:rounded"
        />
        <Badge variant="outline" className={`text-[10px] px-2 py-0 ${atomTypeColors[atom.type]}`}>
          {atom.type}
        </Badge>
      </div>
    </CommandItem>
  )
}
