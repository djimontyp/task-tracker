import { describe, test, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AtomCard } from '../AtomCard'
import { Atom, AtomType } from '../../types'

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number; defaultValue?: string }) => {
      const translations: Record<string, string> = {
        'type.decision': 'Decision',
        'type.question': 'Question',
        'type.insight': 'Insight',
        'status.approved': 'Approved',
        'card.pendingVersions': options?.count === 1
          ? '1 pending version'
          : `${options?.count} pending versions`,
        'card.viewHistory': 'View History',
        'card.versionHistoryTitle': options?.defaultValue || 'Version History',
      }
      return translations[key] || options?.defaultValue || key
    },
  }),
}))

// Note: useProjectLanguage hook is no longer used in AtomCard
// projectLanguage is now passed as prop for better composition

// Mock version history slot component for tests
const MockVersionHistorySlot = ({ atomId }: { atomId: string }) => (
  <div data-testid="version-history-list">
    Version History for atom {atomId}
  </div>
)

// Mock LanguageMismatchBadge
vi.mock('@/shared/components/LanguageMismatchBadge', () => ({
  LanguageMismatchBadge: ({ detectedLanguage }: { detectedLanguage?: string }) =>
    detectedLanguage ? <div data-testid="language-mismatch-badge">{detectedLanguage}</div> : null,
}))

const createMockAtom = (overrides: Partial<Atom> = {}): Atom => ({
  id: 'atom-123',
  type: AtomType.Problem,
  title: 'Test Atom Title',
  content: 'This is test atom content that should be at least long enough to test line clamping behavior when it exceeds multiple lines in the UI component rendering.',
  confidence: 0.75,
  user_approved: false,
  archived: false,
  archived_at: null,
  meta: null,
  pending_versions_count: 0,
  detected_language: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

describe('AtomCard', () => {
  // ========== TEXT TRUNCATION TESTS ==========

  describe('Text Truncation', () => {
    test('truncates long title (line-clamp-2)', () => {
      const longTitle = 'A'.repeat(200)
      const atom = createMockAtom({ title: longTitle })

      render(<AtomCard atom={atom} />)

      const titleElement = screen.getByText(longTitle)
      expect(titleElement).toHaveClass('line-clamp-2')
    })

    test('truncates long content (line-clamp-3)', () => {
      const longContent = 'Lorem ipsum dolor sit amet '.repeat(50)
      const atom = createMockAtom({ content: longContent })

      render(<AtomCard atom={atom} />)

      const contentElement = screen.getByText(/Lorem ipsum/, { exact: false })
      expect(contentElement).toHaveClass('line-clamp-3')
    })

    test('applies proper text size classes', () => {
      const atom = createMockAtom()

      render(<AtomCard atom={atom} />)

      const titleElement = screen.getByText(atom.title)
      expect(titleElement).toHaveClass('text-base')

      const contentElement = screen.getByText(atom.content)
      expect(contentElement).toHaveClass('text-sm')
    })
  })

  // ========== TOUCH TARGET TESTS ==========

  describe('Touch Targets', () => {
    test('version history button has touch target ≥44px', () => {
      const atom = createMockAtom({ pending_versions_count: 2 })

      render(
        <AtomCard
          atom={atom}
          versionHistorySlot={<MockVersionHistorySlot atomId={atom.id} />}
        />
      )

      const button = screen.getByRole('button', { name: /view history/i })
      expect(button).toHaveClass('h-11')
    })
  })

  // ========== RENDERING TESTS ==========

  describe('Rendering', () => {
    test('renders atom with title and content', () => {
      const atom = createMockAtom()

      render(<AtomCard atom={atom} />)

      expect(screen.getByText(atom.title)).toBeInTheDocument()
      expect(screen.getByText(atom.content)).toBeInTheDocument()
    })

    test('renders atom type badge with correct icon', () => {
      const atom = createMockAtom({ type: AtomType.Decision })

      render(<AtomCard atom={atom} />)

      expect(screen.getByText('Decision')).toBeInTheDocument()
    })

    test('renders confidence score when present', () => {
      const atom = createMockAtom({ confidence: 0.85 })

      render(<AtomCard atom={atom} />)

      expect(screen.getByText('85%')).toBeInTheDocument()
    })

    test('does not render confidence when null', () => {
      const atom = createMockAtom({ confidence: null })

      render(<AtomCard atom={atom} />)

      expect(screen.queryByText(/%/)).not.toBeInTheDocument()
    })

    test('renders approved status when user_approved is true', () => {
      const atom = createMockAtom({ user_approved: true })

      render(<AtomCard atom={atom} />)

      expect(screen.getByText('Approved')).toBeInTheDocument()
    })

    test('does not render approved status when user_approved is false', () => {
      const atom = createMockAtom({ user_approved: false })

      render(<AtomCard atom={atom} />)

      expect(screen.queryByText('Approved')).not.toBeInTheDocument()
    })
  })

  // ========== PENDING VERSIONS TESTS ==========

  describe('Pending Versions', () => {
    test('shows pending versions badge when count > 0', () => {
      const atom = createMockAtom({ pending_versions_count: 3 })

      render(<AtomCard atom={atom} />)

      expect(screen.getByText('3 pending versions')).toBeInTheDocument()
    })

    test('shows singular "version" when count = 1', () => {
      const atom = createMockAtom({ pending_versions_count: 1 })

      render(<AtomCard atom={atom} />)

      expect(screen.getByText('1 pending version')).toBeInTheDocument()
    })

    test('does not show pending versions when count = 0', () => {
      const atom = createMockAtom({ pending_versions_count: 0 })

      render(<AtomCard atom={atom} />)

      expect(screen.queryByText(/pending version/i)).not.toBeInTheDocument()
    })

    test('renders view history button when pending versions exist and slot provided', () => {
      const atom = createMockAtom({ pending_versions_count: 2 })

      render(
        <AtomCard
          atom={atom}
          versionHistorySlot={<MockVersionHistorySlot atomId={atom.id} />}
        />
      )

      expect(screen.getByRole('button', { name: /view history/i })).toBeInTheDocument()
    })

    test('does not render view history button when slot is not provided', () => {
      const atom = createMockAtom({ pending_versions_count: 2 })

      render(<AtomCard atom={atom} />)

      expect(screen.queryByRole('button', { name: /view history/i })).not.toBeInTheDocument()
    })
  })

  // ========== VERSION HISTORY DIALOG TESTS ==========

  describe('Version History Dialog', () => {
    test('opens version history dialog on button click', async () => {
      const user = userEvent.setup()
      const atom = createMockAtom({ pending_versions_count: 2 })

      render(
        <AtomCard
          atom={atom}
          versionHistorySlot={<MockVersionHistorySlot atomId={atom.id} />}
        />
      )

      const button = screen.getByRole('button', { name: /view history/i })
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByTestId('version-history-list')).toBeInTheDocument()
      })
    })

    test('stops event propagation when opening dialog', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      const atom = createMockAtom({ pending_versions_count: 2 })

      render(
        <AtomCard
          atom={atom}
          onClick={onClick}
          versionHistorySlot={<MockVersionHistorySlot atomId={atom.id} />}
        />
      )

      const button = screen.getByRole('button', { name: /view history/i })
      await user.click(button)

      // onClick should NOT be called because stopPropagation prevents it
      expect(onClick).not.toHaveBeenCalled()
    })

    test('closes dialog on onOpenChange', async () => {
      const user = userEvent.setup()
      const atom = createMockAtom({ pending_versions_count: 2 })

      render(
        <AtomCard
          atom={atom}
          versionHistorySlot={<MockVersionHistorySlot atomId={atom.id} />}
        />
      )

      // Open dialog
      await user.click(screen.getByRole('button', { name: /view history/i }))

      await waitFor(() => {
        expect(screen.getByTestId('version-history-list')).toBeInTheDocument()
      })

      // Close dialog (ESC key closes Radix dialogs)
      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByTestId('version-history-list')).not.toBeInTheDocument()
      })
    })
  })

  // ========== GLOW EFFECT TESTS ==========

  describe('Glow Effect', () => {
    test('applies glow effect for featured atoms (confidence > 0.8)', () => {
      const atom = createMockAtom({ confidence: 0.9 })

      const { container } = render(<AtomCard atom={atom} />)

      const card = container.querySelector('.shadow-glow-sm')
      expect(card).toBeInTheDocument()
    })

    test('does not apply glow by default for regular atoms (confidence ≤ 0.8)', () => {
      const atom = createMockAtom({ confidence: 0.75 })

      const { container } = render(<AtomCard atom={atom} />)

      // Should only glow on hover
      const card = container.querySelector('.hover\\:shadow-glow-sm')
      expect(card).toBeInTheDocument()
    })

    test('applies hover glow for all atoms', () => {
      const atom = createMockAtom({ confidence: 0.5 })

      const { container } = render(<AtomCard atom={atom} />)

      const card = container.querySelector('.hover\\:shadow-glow-sm')
      expect(card).toBeInTheDocument()
    })
  })

  // ========== INTERACTION TESTS ==========

  describe('Interaction', () => {
    test('calls onClick when card is clicked', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      const atom = createMockAtom()

      render(<AtomCard atom={atom} onClick={onClick} />)

      await user.click(screen.getByText(atom.title))

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    test('applies cursor-pointer when onClick is provided', () => {
      const onClick = vi.fn()
      const atom = createMockAtom()

      const { container } = render(<AtomCard atom={atom} onClick={onClick} />)

      const card = container.querySelector('.cursor-pointer')
      expect(card).toBeInTheDocument()
    })

    test('does not apply cursor-pointer when onClick is not provided', () => {
      const atom = createMockAtom()

      const { container } = render(<AtomCard atom={atom} />)

      const card = container.querySelector('.cursor-pointer')
      expect(card).not.toBeInTheDocument()
    })
  })

  // ========== TYPE LABEL TESTS ==========

  describe('Type Labels', () => {
    test('renders translated label for decision type', () => {
      const atom = createMockAtom({ type: AtomType.Decision })

      render(<AtomCard atom={atom} />)

      expect(screen.getByText('Decision')).toBeInTheDocument()
    })

    test('renders translated label for question type', () => {
      const atom = createMockAtom({ type: AtomType.Question })

      render(<AtomCard atom={atom} />)

      expect(screen.getByText('Question')).toBeInTheDocument()
    })

    test('renders capitalized fallback for untranslated types', () => {
      const atom = createMockAtom({ type: AtomType.Problem })

      render(<AtomCard atom={atom} />)

      // Falls back to capitalized type
      expect(screen.getByText('Problem')).toBeInTheDocument()
    })
  })
})
