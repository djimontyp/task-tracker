/**
 * ReviewQueue - AI Atom Triage Interface
 *
 * A keyboard-first review interface for approving/rejecting AI-extracted atoms.
 * Designed for rapid triage with minimal friction.
 *
 * Keyboard shortcuts:
 * - j/ArrowDown: Next atom
 * - k/ArrowUp: Previous atom
 * - a: Approve current atom
 * - r: Reject current atom
 * - Space: Toggle selection
 * - Shift+Click: Range selection
 * - Ctrl/Cmd+A: Select all
 * - ?: Show keyboard shortcuts
 *
 * @accessibility
 * - WCAG AA compliant
 * - Full keyboard navigation
 * - Screen reader announcements for actions
 * - Focus management
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import { Separator } from '@/shared/ui/separator';
import { Progress } from '@/shared/ui/progress';
import { Checkbox } from '@/shared/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import { cn } from '@/shared/lib/utils';
import { touchTarget } from '@/shared/tokens/spacing';
import { atom as atomColors } from '@/shared/tokens/colors';
import { badges, focus, emptyState as emptyStateTokens } from '@/shared/tokens/patterns';
import { EmptyState } from '@/shared/patterns/EmptyState';
import {
  Check,
  X,
  ChevronUp,
  ChevronDown,
  Lightbulb,
  Clock,
  Sparkles,
  HelpCircle,
  Keyboard,
  CheckCircle,
  XCircle,
  SkipForward,
  Inbox,
  ArrowRight,
  Quote,
  User,
  Tag,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type AtomType = 'task' | 'idea' | 'question' | 'decision' | 'insight';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ReviewAtom {
  id: string;
  type: AtomType;
  title: string;
  content: string;
  sourceMessage: {
    text: string;
    author: string;
    timestamp: Date;
  };
  aiReasoning: string;
  confidence: number;
  tags: string[];
  status: ReviewStatus;
}

export interface ReviewQueueProps {
  /** Atoms to review */
  atoms: ReviewAtom[];
  /** Called when atom is approved */
  onApprove?: (atomId: string) => void;
  /** Called when atom is rejected */
  onReject?: (atomId: string) => void;
  /** Called when batch action is performed */
  onBatchAction?: (atomIds: string[], action: 'approve' | 'reject') => void;
  /** Called when all atoms are reviewed */
  onComplete?: () => void;
  /** Whether actions are loading */
  isLoading?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const ATOM_TYPE_CONFIG: Record<AtomType, { label: string; icon: typeof Lightbulb; colorClass: string }> = {
  task: {
    label: 'Task',
    icon: CheckCircle,
    colorClass: atomColors.decision.text,
  },
  idea: {
    label: 'Idea',
    icon: Lightbulb,
    colorClass: atomColors.insight.text,
  },
  question: {
    label: 'Question',
    icon: HelpCircle,
    colorClass: atomColors.question.text,
  },
  decision: {
    label: 'Decision',
    icon: Check,
    colorClass: atomColors.decision.text,
  },
  insight: {
    label: 'Insight',
    icon: Sparkles,
    colorClass: atomColors.insight.text,
  },
};

const KEYBOARD_SHORTCUTS = [
  { key: 'j / ArrowDown', action: 'Next atom' },
  { key: 'k / ArrowUp', action: 'Previous atom' },
  { key: 'a', action: 'Approve current' },
  { key: 'r', action: 'Reject current' },
  { key: 'Space', action: 'Toggle selection' },
  { key: 'Shift+Click', action: 'Range select' },
  { key: 'Ctrl/Cmd+A', action: 'Select all' },
];

// ═══════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════

interface AtomCardProps {
  atom: ReviewAtom;
  isActive: boolean;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onFocus: () => void;
  innerRef?: (el: HTMLDivElement | null) => void;
}

function AtomCard({ atom, isActive, isSelected, onSelect, onFocus, innerRef }: AtomCardProps) {
  const config = ATOM_TYPE_CONFIG[atom.type];
  const Icon = config.icon;

  return (
    <div
      ref={innerRef}
      role="option"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      onFocus={onFocus}
      onClick={(e) => onSelect(atom.id, e.shiftKey)}
      className={cn(
        'group relative rounded-lg border-2 p-4 transition-all duration-200 cursor-pointer',
        focus.ring,
        isActive
          ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
          : 'border-border bg-card hover:border-primary/50',
        isSelected && 'bg-primary/10',
        atom.status === 'approved' && 'opacity-60 border-semantic-success/50',
        atom.status === 'rejected' && 'opacity-60 border-destructive/50'
      )}
    >
      {/* Selection checkbox */}
      <div className="absolute left-3 top-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(atom.id, false)}
          aria-label={`Select ${atom.title}`}
          className="h-5 w-5"
        />
      </div>

      {/* Status indicator */}
      {atom.status !== 'pending' && (
        <div className="absolute right-3 top-3">
          {atom.status === 'approved' ? (
            <Badge className={badges.semantic.success}>
              <CheckCircle className="h-3 w-3 mr-1" />
              Approved
            </Badge>
          ) : (
            <Badge className={badges.semantic.error}>
              <XCircle className="h-3 w-3 mr-1" />
              Rejected
            </Badge>
          )}
        </div>
      )}

      {/* Content */}
      <div className="ml-8 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={cn('rounded-full bg-muted p-2', config.colorClass)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {config.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {Math.round(atom.confidence * 100)}% confidence
              </span>
            </div>
            <h4 className="font-medium text-sm line-clamp-1">{atom.title}</h4>
          </div>
        </div>

        {/* Content preview */}
        <p className="text-sm text-muted-foreground line-clamp-2">{atom.content}</p>

        {/* Tags */}
        {atom.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <Tag className="h-3 w-3 text-muted-foreground" />
            {atom.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                {tag}
              </Badge>
            ))}
            {atom.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">+{atom.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ContextPanelProps {
  atom: ReviewAtom | null;
}

function ContextPanel({ atom }: ContextPanelProps) {
  if (!atom) {
    return (
      <div className={cn(emptyStateTokens.container, 'h-full')}>
        <div className={emptyStateTokens.icon}>
          <Lightbulb className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className={emptyStateTokens.title}>Select an atom</p>
        <p className={emptyStateTokens.description}>
          Choose an atom from the list to see details and AI reasoning
        </p>
      </div>
    );
  }

  const config = ATOM_TYPE_CONFIG[atom.type];
  const Icon = config.icon;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn('rounded-full bg-muted p-3', config.colorClass)}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <Badge variant="outline" className="mb-1">
              {config.label}
            </Badge>
            <h3 className="text-lg font-semibold">{atom.title}</h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{atom.content}</p>
      </div>

      {/* Source message */}
      <div className="p-6 border-b">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Source Message
        </h4>
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{atom.sourceMessage.author}</span>
            <span className="text-muted-foreground/50">|</span>
            <Clock className="h-3 w-3" />
            <span>{atom.sourceMessage.timestamp.toLocaleDateString()}</span>
          </div>
          <div className="flex gap-2">
            <Quote className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm italic">{atom.sourceMessage.text}</p>
          </div>
        </div>
      </div>

      {/* AI Reasoning */}
      <div className="p-6 flex-1 overflow-auto">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Sparkles className="h-3 w-3" />
          Why this is important
        </h4>
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <p className="text-sm">{atom.aiReasoning}</p>
        </div>

        {/* Confidence indicator */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">AI Confidence</span>
            <span className="font-medium">{Math.round(atom.confidence * 100)}%</span>
          </div>
          <Progress
            value={atom.confidence * 100}
            className="h-2"
          />
        </div>
      </div>
    </div>
  );
}

interface ShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

function ShortcutsHelp({ isOpen, onClose }: ShortcutsHelpProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <Card className="w-full max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="pb-4">
          <h2 id="shortcuts-title" className="font-semibold flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </h2>
        </CardHeader>
        <CardContent className="space-y-2">
          {KEYBOARD_SHORTCUTS.map((shortcut) => (
            <div key={shortcut.key} className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">{shortcut.action}</span>
              <kbd className="bg-muted px-2 py-1 rounded text-xs font-mono">
                {shortcut.key}
              </kbd>
            </div>
          ))}
          <Separator className="my-4" />
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="bg-muted px-1.5 py-0.5 rounded font-mono">?</kbd> to toggle this help
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function ReviewQueue({
  atoms,
  onApprove,
  onReject,
  onBatchAction,
  onComplete,
  isLoading = false,
}: ReviewQueueProps) {
  // State
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Refs
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Computed
  const pendingAtoms = useMemo(() => atoms.filter((a) => a.status === 'pending'), [atoms]);
  const reviewedCount = useMemo(() => atoms.filter((a) => a.status !== 'pending').length, [atoms]);
  const activeAtom = atoms[activeIndex] ?? null;
  const progress = atoms.length > 0 ? (reviewedCount / atoms.length) * 100 : 0;

  // Screen reader announcement
  const announce = useCallback((message: string) => {
    const el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.className = 'sr-only';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => document.body.removeChild(el), 1000);
  }, []);

  // Navigation
  const goToNext = useCallback(() => {
    if (activeIndex < atoms.length - 1) {
      setActiveIndex((i) => i + 1);
    }
  }, [activeIndex, atoms.length]);

  const goToPrev = useCallback(() => {
    if (activeIndex > 0) {
      setActiveIndex((i) => i - 1);
    }
  }, [activeIndex]);

  // Selection
  const toggleSelection = useCallback((id: string, shiftKey: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const currentIndex = atoms.findIndex((a) => a.id === id);

      if (shiftKey && lastSelectedIndex !== null) {
        // Range selection
        const start = Math.min(lastSelectedIndex, currentIndex);
        const end = Math.max(lastSelectedIndex, currentIndex);
        for (let i = start; i <= end; i++) {
          next.add(atoms[i].id);
        }
      } else {
        // Toggle single
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
      }

      setLastSelectedIndex(currentIndex);
      return next;
    });
  }, [atoms, lastSelectedIndex]);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(atoms.map((a) => a.id)));
    announce('All atoms selected');
  }, [atoms, announce]);

  // Actions
  const handleApprove = useCallback((id?: string) => {
    const targetId = id ?? activeAtom?.id;
    if (targetId) {
      onApprove?.(targetId);
      announce('Atom approved');
      goToNext();
    }
  }, [activeAtom, onApprove, goToNext, announce]);

  const handleReject = useCallback((id?: string) => {
    const targetId = id ?? activeAtom?.id;
    if (targetId) {
      onReject?.(targetId);
      announce('Atom rejected');
      goToNext();
    }
  }, [activeAtom, onReject, goToNext, announce]);

  const handleBatchApprove = useCallback(() => {
    if (selectedIds.size > 0) {
      onBatchAction?.(Array.from(selectedIds), 'approve');
      announce(`${selectedIds.size} atoms approved`);
      setSelectedIds(new Set());
    }
  }, [selectedIds, onBatchAction, announce]);

  const handleBatchReject = useCallback(() => {
    if (selectedIds.size > 0) {
      onBatchAction?.(Array.from(selectedIds), 'reject');
      announce(`${selectedIds.size} atoms rejected`);
      setSelectedIds(new Set());
    }
  }, [selectedIds, onBatchAction, announce]);

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if focused on input
      if ((e.target as HTMLElement)?.tagName?.match(/INPUT|TEXTAREA/)) return;

      switch (e.key) {
        case 'j':
        case 'ArrowDown':
          e.preventDefault();
          goToNext();
          break;
        case 'k':
        case 'ArrowUp':
          e.preventDefault();
          goToPrev();
          break;
        case 'a':
          e.preventDefault();
          handleApprove();
          break;
        case 'r':
          e.preventDefault();
          handleReject();
          break;
        case ' ':
          e.preventDefault();
          if (activeAtom) {
            toggleSelection(activeAtom.id, e.shiftKey);
          }
          break;
        case 'A':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            selectAll();
          }
          break;
        case '?':
          e.preventDefault();
          setShowShortcuts((v) => !v);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, handleApprove, handleReject, toggleSelection, selectAll, activeAtom]);

  // Scroll active item into view
  useEffect(() => {
    const el = itemRefs.current.get(activeIndex);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeIndex]);

  // Check completion
  useEffect(() => {
    if (pendingAtoms.length === 0 && atoms.length > 0) {
      onComplete?.();
    }
  }, [pendingAtoms.length, atoms.length, onComplete]);

  // Empty state
  if (atoms.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No atoms to review"
        description="Run an extraction to generate knowledge atoms for review"
        variant="card"
      />
    );
  }

  // Completion state
  if (pendingAtoms.length === 0) {
    return (
      <div className={cn(emptyStateTokens.container, 'py-16')}>
        <div className="rounded-full bg-semantic-success/10 p-6 mb-6">
          <CheckCircle className="h-12 w-12 text-semantic-success" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Review Complete</h3>
        <p className="text-muted-foreground mb-6 max-w-sm text-center">
          You&apos;ve reviewed all {atoms.length} atoms. Great work!
        </p>
        <div className="flex items-center gap-4 text-sm">
          <Badge className={badges.semantic.success}>
            <CheckCircle className="h-3 w-3 mr-1" />
            {atoms.filter((a) => a.status === 'approved').length} approved
          </Badge>
          <Badge className={badges.semantic.error}>
            <XCircle className="h-3 w-3 mr-1" />
            {atoms.filter((a) => a.status === 'rejected').length} rejected
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        {/* Header with progress */}
        <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Inbox className="h-5 w-5" />
                Review Queue
              </h2>
              <p className="text-sm text-muted-foreground">
                {activeIndex + 1} of {atoms.length} atoms
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={touchTarget.min}
                    onClick={() => setShowShortcuts(true)}
                    aria-label="Show keyboard shortcuts"
                  >
                    <Keyboard className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Keyboard shortcuts (?)</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{reviewedCount} reviewed</span>
              <span>{pendingAtoms.length} remaining</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Batch actions */}
          {selectedIds.size > 0 && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-muted/50 rounded-lg animate-in fade-in-50 slide-in-from-top-2">
              <span className="text-sm font-medium">{selectedIds.size} selected</span>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchReject}
                className="text-destructive hover:text-destructive"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject All
              </Button>
              <Button
                size="sm"
                onClick={handleBatchApprove}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve All
              </Button>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 flex min-h-0">
          {/* Atom list */}
          <div
            ref={listRef}
            className="w-1/2 border-r overflow-y-auto p-4 space-y-2"
            role="listbox"
            aria-label="Atoms to review"
            aria-activedescendant={activeAtom?.id}
          >
            {atoms.map((atom, index) => (
              <AtomCard
                key={atom.id}
                atom={atom}
                isActive={index === activeIndex}
                isSelected={selectedIds.has(atom.id)}
                onSelect={toggleSelection}
                onFocus={() => setActiveIndex(index)}
                innerRef={(el: HTMLDivElement | null) => {
                  if (el) itemRefs.current.set(index, el);
                }}
              />
            ))}
          </div>

          {/* Context panel */}
          <div className="w-1/2 bg-muted/20">
            <ContextPanel atom={activeAtom} />
          </div>
        </div>

        {/* Action bar */}
        <div className="flex-shrink-0 border-t bg-background p-4">
          <div className="flex items-center justify-between">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={touchTarget.min}
                    onClick={goToPrev}
                    disabled={activeIndex === 0}
                    aria-label="Previous atom (k)"
                  >
                    <ChevronUp className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous (k)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={touchTarget.min}
                    onClick={goToNext}
                    disabled={activeIndex === atoms.length - 1}
                    aria-label="Next atom (j)"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next (j)</TooltipContent>
              </Tooltip>
            </div>

            {/* Main actions */}
            <div className="flex items-center gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(touchTarget.min, 'text-destructive hover:text-destructive')}
                    onClick={() => handleReject()}
                    disabled={isLoading || !activeAtom || activeAtom.status !== 'pending'}
                    aria-label="Reject atom (r)"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Reject
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reject (r)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="lg"
                    className={cn(touchTarget.min)}
                    onClick={() => handleApprove()}
                    disabled={isLoading || !activeAtom || activeAtom.status !== 'pending'}
                    aria-label="Approve atom (a)"
                  >
                    <Check className="h-5 w-5 mr-2" />
                    Approve
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Approve (a)</TooltipContent>
              </Tooltip>
            </div>

            {/* Skip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={touchTarget.min}
                  onClick={goToNext}
                  disabled={activeIndex === atoms.length - 1}
                  aria-label="Skip to next"
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Skip</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Shortcuts help modal */}
        <ShortcutsHelp isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      </div>
    </TooltipProvider>
  );
}

export default ReviewQueue;
