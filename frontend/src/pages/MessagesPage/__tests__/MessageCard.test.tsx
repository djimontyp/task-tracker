import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MessageCard } from '../MessageCard'
import { Message } from '@/shared/types'

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'card.actions.createAtom': 'Create Atom',
        'card.actions.dismiss': 'Dismiss',
      }
      return translations[key] || key
    },
  }),
}))

// Mock scoring config hook
vi.mock('@/shared/api/scoringConfig', () => ({
  useScoringConfig: () => ({
    data: {
      signal_threshold: 0.65,
      noise_threshold: 0.35,
    },
  }),
}))

// Mock utility functions
vi.mock('@/shared/utils/statusBadges', () => ({
  getMessageAnalysisBadge: (analyzed: boolean) => ({
    label: analyzed ? 'Analyzed' : 'Pending',
    variant: analyzed ? 'default' : 'secondary',
    className: '',
  }),
  getImportanceBadge: (score: number) => ({
    label: score >= 0.65 ? 'High' : score >= 0.35 ? 'Medium' : 'Low',
    variant: 'default',
    className: score >= 0.65 ? 'bg-semantic-success' : '',
  }),
  getNoiseClassificationBadge: (classification: string) => ({
    label: classification === 'signal' ? 'Signal' : 'Noise',
    variant: 'default',
    className: '',
  }),
}))

vi.mock('@/shared/utils/date', () => ({
  formatFullDate: (date: string) => new Date(date).toLocaleString(),
}))

const createMockMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 'msg-123',
  content: 'This is a test message content that should be displayed in the card component and might be quite long to test truncation behavior when it exceeds multiple lines.',
  author: 'test-user',
  author_name: 'Test User',
  avatar_url: 'https://example.com/avatar.jpg',
  sent_at: '2024-01-01T12:00:00Z',
  analyzed: false,
  importance_score: null,
  noise_classification: null,
  topic_name: null,
  ...overrides,
})

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('MessageCard', () => {
  // ========== TEXT TRUNCATION TESTS ==========

  describe('Text Truncation', () => {
    test('truncates long content (line-clamp-3)', () => {
      const longContent = 'Lorem ipsum dolor sit amet '.repeat(100)
      const message = createMockMessage({ content: longContent })

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      const contentElement = screen.getByText(/Lorem ipsum/, { exact: false })
      expect(contentElement).toHaveClass('line-clamp-3')
    })

    test('truncates long author name', () => {
      const longName = 'Very Long Author Name That Exceeds Reasonable Display Width'
      const message = createMockMessage({ author_name: longName })

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      const nameElement = screen.getByText(longName)
      expect(nameElement).toHaveClass('truncate')
    })

    test('truncates long topic name badge', () => {
      const longTopic = 'Very Long Topic Name That Should Be Truncated'
      const message = createMockMessage({ topic_name: longTopic })

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      const topicBadge = screen.getByText(longTopic)
      expect(topicBadge).toHaveClass('truncate')
    })
  })

  // ========== TOUCH TARGET TESTS ==========

  describe('Touch Targets', () => {
    test('action buttons have touch targets ≥44px', () => {
      const message = createMockMessage()

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
          onCreateAtom={vi.fn()}
          onDismiss={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      // Buttons appear on hover, rendered but hidden
      const createButton = screen.getByRole('button', { name: /create atom/i })
      const dismissButton = screen.getByRole('button', { name: /dismiss/i })

      expect(createButton).toHaveClass('h-11')
      expect(dismissButton).toHaveClass('h-11')
    })
  })

  // ========== RENDERING TESTS ==========

  describe('Rendering', () => {
    test('renders message content', () => {
      const message = createMockMessage()

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText(message.content)).toBeInTheDocument()
    })

    test('renders author name when provided', () => {
      const message = createMockMessage({ author_name: 'John Doe' })

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    test('falls back to author when author_name not provided', () => {
      const message = createMockMessage({ author_name: undefined, author: 'user123' })

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('user123')).toBeInTheDocument()
    })

    test('renders avatar when avatar_url provided', () => {
      const message = createMockMessage({ avatar_url: 'https://example.com/avatar.jpg' })

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      const avatar = screen.getByRole('img')
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })

    test('renders fallback avatar when avatar_url not provided', () => {
      const message = createMockMessage({ avatar_url: undefined })

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.queryByRole('img')).not.toBeInTheDocument()
      // Should render User icon instead
      const container = document.querySelector('.h-8.w-8.rounded-full.bg-muted')
      expect(container).toBeInTheDocument()
    })

    test('renders sent_at timestamp', () => {
      const message = createMockMessage({ sent_at: '2024-03-15T10:30:00Z' })

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText(/2024/)).toBeInTheDocument()
    })

    test('renders "-" when sent_at is null', () => {
      const message = createMockMessage({ sent_at: null })

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('-')).toBeInTheDocument()
    })
  })

  // ========== EMPTY MESSAGE TESTS ==========

  describe('Empty Message', () => {
    test('shows "(Empty message)" when content is empty string', () => {
      const message = createMockMessage({ content: '' })

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('(Empty message)')).toBeInTheDocument()
    })

    test('shows "(Empty message)" when content is whitespace only', () => {
      const message = createMockMessage({ content: '   \n  \t  ' })

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('(Empty message)')).toBeInTheDocument()
    })

    test('does not show empty state for valid content', () => {
      const message = createMockMessage({ content: 'Valid message' })

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.queryByText('(Empty message)')).not.toBeInTheDocument()
    })
  })

  // ========== STATUS BADGES TESTS ==========

  describe('Status Badges', () => {
    test('renders analysis status badge', () => {
      const message = createMockMessage({ analyzed: true })

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('Analyzed')).toBeInTheDocument()
    })

    test('renders importance badge when score is present', () => {
      const message = createMockMessage({ importance_score: 0.8 })

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('High')).toBeInTheDocument()
    })

    test('does not render importance badge when score is null', () => {
      const message = createMockMessage({ importance_score: null })

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.queryByText(/high|medium|low/i)).not.toBeInTheDocument()
    })

    test('renders noise classification badge when present', () => {
      const message = createMockMessage({ noise_classification: 'signal' })

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('Signal')).toBeInTheDocument()
    })

    test('renders topic name badge when present', () => {
      const message = createMockMessage({ topic_name: 'Frontend' })

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('Frontend')).toBeInTheDocument()
    })
  })

  // ========== GLOW EFFECT TESTS ==========

  describe('Glow Effect', () => {
    test('applies glow effect for high importance messages (≥ threshold)', () => {
      const message = createMockMessage({ importance_score: 0.8 })

      const { container } = render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      const card = container.querySelector('.shadow-glow-sm')
      expect(card).toBeInTheDocument()
    })

    test('does not apply glow for low importance messages (< threshold)', () => {
      const message = createMockMessage({ importance_score: 0.5 })

      const { container } = render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      const card = container.querySelector('.shadow-glow-sm')
      expect(card).not.toBeInTheDocument()
    })

    test('does not apply glow when importance_score is null', () => {
      const message = createMockMessage({ importance_score: null })

      const { container } = render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      const card = container.querySelector('.shadow-glow-sm')
      expect(card).not.toBeInTheDocument()
    })
  })

  // ========== SELECTION TESTS ==========

  describe('Selection', () => {
    test('renders checkbox', () => {
      const message = createMockMessage()

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    test('checkbox is checked when isSelected is true', () => {
      const message = createMockMessage()

      render(
        <MessageCard
          message={message}
          isSelected={true}
          onSelect={vi.fn()}
          onClick={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByRole('checkbox')).toBeChecked()
    })

    test('checkbox is unchecked when isSelected is false', () => {
      const message = createMockMessage()

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByRole('checkbox')).not.toBeChecked()
    })

    test('calls onSelect when checkbox is clicked', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      const message = createMockMessage()

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={onSelect}
          onClick={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByRole('checkbox'))

      expect(onSelect).toHaveBeenCalledWith(true)
    })

    test('applies selection styles when isSelected is true', () => {
      const message = createMockMessage()

      const { container } = render(
        <MessageCard
          message={message}
          isSelected={true}
          onSelect={vi.fn()}
          onClick={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      const card = container.querySelector('.border-primary')
      expect(card).toBeInTheDocument()
    })
  })

  // ========== INTERACTION TESTS ==========

  describe('Interaction', () => {
    test('calls onClick when card is clicked', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      const message = createMockMessage()

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={onClick}
        />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByText(message.content))

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    test('does not call onClick when checkbox is clicked', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      const message = createMockMessage()

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={onClick}
        />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByRole('checkbox'))

      // onClick should NOT be called due to stopPropagation
      expect(onClick).not.toHaveBeenCalled()
    })

    test('calls onCreateAtom when create atom button is clicked', async () => {
      const user = userEvent.setup()
      const onCreateAtom = vi.fn()
      const message = createMockMessage()

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
          onCreateAtom={onCreateAtom}
        />,
        { wrapper: createWrapper() }
      )

      const button = screen.getByRole('button', { name: /create atom/i })
      await user.click(button)

      expect(onCreateAtom).toHaveBeenCalledTimes(1)
    })

    test('calls onDismiss when dismiss button is clicked', async () => {
      const user = userEvent.setup()
      const onDismiss = vi.fn()
      const message = createMockMessage()

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
          onDismiss={onDismiss}
        />,
        { wrapper: createWrapper() }
      )

      const button = screen.getByRole('button', { name: /dismiss/i })
      await user.click(button)

      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    test('action buttons do not trigger card onClick', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      const message = createMockMessage()

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={onClick}
          onCreateAtom={vi.fn()}
          onDismiss={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      await user.click(screen.getByRole('button', { name: /create atom/i }))
      await user.click(screen.getByRole('button', { name: /dismiss/i }))

      // onClick should NOT be called due to stopPropagation
      expect(onClick).not.toHaveBeenCalled()
    })
  })

  // ========== ACTION BUTTONS VISIBILITY ==========

  describe('Action Buttons Visibility', () => {
    test('renders action buttons when callbacks provided', () => {
      const message = createMockMessage()

      render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
          onCreateAtom={vi.fn()}
          onDismiss={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByRole('button', { name: /create atom/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument()
    })

    test('action buttons have opacity-0 by default (group-hover pattern)', () => {
      const message = createMockMessage()

      const { container } = render(
        <MessageCard
          message={message}
          isSelected={false}
          onSelect={vi.fn()}
          onClick={vi.fn()}
          onCreateAtom={vi.fn()}
          onDismiss={vi.fn()}
        />,
        { wrapper: createWrapper() }
      )

      const buttonsContainer = container.querySelector('.opacity-0')
      expect(buttonsContainer).toBeInTheDocument()
    })
  })
})
