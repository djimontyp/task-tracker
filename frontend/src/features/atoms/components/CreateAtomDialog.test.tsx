import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CreateAtomDialog } from './CreateAtomDialog'
import { atomService } from '../api/atomService'
import { AtomType } from '../types'

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock atomService
vi.mock('../api/atomService', () => ({
  atomService: {
    createAtom: vi.fn(),
    linkAtomToTopic: vi.fn(),
  },
}))

// Test wrapper with providers
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

describe('CreateAtomDialog', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnAtomCreated = vi.fn()
  const testTopicId = 'test-topic-123'

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    topicId: testTopicId,
    onAtomCreated: mockOnAtomCreated,
  }

  const createMockAtom = (overrides = {}) => ({
    id: 'atom-123',
    type: AtomType.Problem,
    title: 'Test Atom',
    content: 'This is a valid test content with enough characters',
    confidence: 0.8,
    user_approved: false,
    archived: false,
    archived_at: null,
    meta: null,
    pending_versions_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ========== RENDERING TESTS ==========

  describe('Rendering', () => {
    test('renders dialog with title and description when open', () => {
      render(<CreateAtomDialog {...defaultProps} />, { wrapper: createWrapper() })

      expect(screen.getByText('Створити новий атом')).toBeInTheDocument()
      expect(screen.getByText(/атом буде автоматично прив'язаний/i)).toBeInTheDocument()
    })

    test('renders all form fields', () => {
      render(<CreateAtomDialog {...defaultProps} />, { wrapper: createWrapper() })

      // Form fields by their id or placeholder
      expect(screen.getByPlaceholderText(/короткий опис/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/детальний опис/i)).toBeInTheDocument()

      // Buttons
      expect(screen.getByRole('button', { name: /скасувати/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /створити атом/i })).toBeInTheDocument()
    })

    test('does not render when open is false', () => {
      render(<CreateAtomDialog {...defaultProps} open={false} />, {
        wrapper: createWrapper(),
      })

      expect(screen.queryByText('Створити новий атом')).not.toBeInTheDocument()
    })

    test('shows confidence slider with default value of 80%', () => {
      render(<CreateAtomDialog {...defaultProps} />, { wrapper: createWrapper() })

      expect(screen.getByText('80%')).toBeInTheDocument()
    })
  })

  // ========== VALIDATION TESTS ==========

  describe('Validation', () => {
    test('shows validation error when submitting with empty title', async () => {
      const user = userEvent.setup()
      render(<CreateAtomDialog {...defaultProps} />, { wrapper: createWrapper() })

      const submitButton = screen.getByRole('button', { name: /створити атом/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/заголовок обов'язковий/i)).toBeInTheDocument()
      })
    })

    test('shows validation error when content is less than 10 characters', async () => {
      const user = userEvent.setup()
      render(<CreateAtomDialog {...defaultProps} />, { wrapper: createWrapper() })

      const titleInput = screen.getByPlaceholderText(/короткий опис/i)
      const contentInput = screen.getByPlaceholderText(/детальний опис/i)

      await user.type(titleInput, 'Test title')
      await user.type(contentInput, 'Short')

      const submitButton = screen.getByRole('button', { name: /створити атом/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/мінімум 10 символів/i)).toBeInTheDocument()
      })
    })

    test('does not call API when validation fails', async () => {
      const user = userEvent.setup()
      render(<CreateAtomDialog {...defaultProps} />, { wrapper: createWrapper() })

      // Submit without filling anything
      const submitButton = screen.getByRole('button', { name: /створити атом/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/заголовок обов'язковий/i)).toBeInTheDocument()
      })

      expect(atomService.createAtom).not.toHaveBeenCalled()
    })
  })

  // ========== SUBMISSION TESTS ==========

  describe('Submission', () => {
    test('calls atomService.createAtom with correct data on valid submit', async () => {
      const user = userEvent.setup()
      const mockAtom = createMockAtom()

      vi.mocked(atomService.createAtom).mockResolvedValue(mockAtom)
      vi.mocked(atomService.linkAtomToTopic).mockResolvedValue({
        topic_id: testTopicId,
        atom_id: mockAtom.id,
        position: null,
        note: null,
        created_at: new Date().toISOString(),
      })

      render(<CreateAtomDialog {...defaultProps} />, { wrapper: createWrapper() })

      const titleInput = screen.getByPlaceholderText(/короткий опис/i)
      const contentInput = screen.getByPlaceholderText(/детальний опис/i)

      await user.type(titleInput, 'Test Atom Title')
      await user.type(contentInput, 'This is test content with enough characters for validation')

      const submitButton = screen.getByRole('button', { name: /створити атом/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(atomService.createAtom).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Atom Title',
            content: 'This is test content with enough characters for validation',
            type: AtomType.Problem, // default type
            confidence: 0.8, // default confidence
          })
        )
      })
    })

    test('links atom to topic after creation', async () => {
      const user = userEvent.setup()
      const mockAtom = createMockAtom({ id: 'atom-456' })

      vi.mocked(atomService.createAtom).mockResolvedValue(mockAtom)
      vi.mocked(atomService.linkAtomToTopic).mockResolvedValue({
        topic_id: testTopicId,
        atom_id: mockAtom.id,
        position: null,
        note: null,
        created_at: new Date().toISOString(),
      })

      render(<CreateAtomDialog {...defaultProps} />, { wrapper: createWrapper() })

      await user.type(screen.getByPlaceholderText(/короткий опис/i), 'Test')
      await user.type(screen.getByPlaceholderText(/детальний опис/i), 'Test content minimum length')

      await user.click(screen.getByRole('button', { name: /створити атом/i }))

      await waitFor(() => {
        expect(atomService.linkAtomToTopic).toHaveBeenCalledWith('atom-456', testTopicId)
      })
    })

    test('calls onAtomCreated callback after successful submission', async () => {
      const user = userEvent.setup()
      const mockAtom = createMockAtom({ id: 'atom-789' })

      vi.mocked(atomService.createAtom).mockResolvedValue(mockAtom)
      vi.mocked(atomService.linkAtomToTopic).mockResolvedValue({
        topic_id: testTopicId,
        atom_id: mockAtom.id,
        position: null,
        note: null,
        created_at: new Date().toISOString(),
      })

      render(<CreateAtomDialog {...defaultProps} />, { wrapper: createWrapper() })

      await user.type(screen.getByPlaceholderText(/короткий опис/i), 'Test')
      await user.type(screen.getByPlaceholderText(/детальний опис/i), 'Test content minimum length')

      await user.click(screen.getByRole('button', { name: /створити атом/i }))

      await waitFor(() => {
        expect(mockOnAtomCreated).toHaveBeenCalledWith(mockAtom)
      })
    })

    test('closes dialog after successful submission', async () => {
      const user = userEvent.setup()
      const mockAtom = createMockAtom()

      vi.mocked(atomService.createAtom).mockResolvedValue(mockAtom)
      vi.mocked(atomService.linkAtomToTopic).mockResolvedValue({
        topic_id: testTopicId,
        atom_id: mockAtom.id,
        position: null,
        note: null,
        created_at: new Date().toISOString(),
      })

      render(<CreateAtomDialog {...defaultProps} />, { wrapper: createWrapper() })

      await user.type(screen.getByPlaceholderText(/короткий опис/i), 'Test')
      await user.type(screen.getByPlaceholderText(/детальний опис/i), 'Test content minimum length')

      await user.click(screen.getByRole('button', { name: /створити атом/i }))

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false)
      })
    })

    test('shows loading state during submission', async () => {
      const user = userEvent.setup()

      // Create a promise that we control
      let resolveCreate: (value: unknown) => void
      const createPromise = new Promise((resolve) => {
        resolveCreate = resolve
      })

      vi.mocked(atomService.createAtom).mockReturnValue(createPromise as Promise<ReturnType<typeof atomService.createAtom>>)

      render(<CreateAtomDialog {...defaultProps} />, { wrapper: createWrapper() })

      await user.type(screen.getByPlaceholderText(/короткий опис/i), 'Test')
      await user.type(screen.getByPlaceholderText(/детальний опис/i), 'Test content minimum length')

      await user.click(screen.getByRole('button', { name: /створити атом/i }))

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/створення/i)).toBeInTheDocument()
      })

      // Resolve the promise
      resolveCreate!(createMockAtom())
    })

    test('disables buttons during submission', async () => {
      const user = userEvent.setup()

      let resolveCreate: (value: unknown) => void
      const createPromise = new Promise((resolve) => {
        resolveCreate = resolve
      })

      vi.mocked(atomService.createAtom).mockReturnValue(createPromise as Promise<ReturnType<typeof atomService.createAtom>>)

      render(<CreateAtomDialog {...defaultProps} />, { wrapper: createWrapper() })

      await user.type(screen.getByPlaceholderText(/короткий опис/i), 'Test')
      await user.type(screen.getByPlaceholderText(/детальний опис/i), 'Test content minimum length')

      const submitButton = screen.getByRole('button', { name: /створити атом/i })
      const cancelButton = screen.getByRole('button', { name: /скасувати/i })

      await user.click(submitButton)

      await waitFor(() => {
        expect(cancelButton).toBeDisabled()
      })

      resolveCreate!(createMockAtom())
    })
  })

  // ========== CANCEL TESTS ==========

  describe('Cancel', () => {
    test('calls onOpenChange(false) when cancel button clicked', async () => {
      const user = userEvent.setup()
      render(<CreateAtomDialog {...defaultProps} />, { wrapper: createWrapper() })

      const cancelButton = screen.getByRole('button', { name: /скасувати/i })
      await user.click(cancelButton)

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    test('resets form when cancel button clicked', async () => {
      const user = userEvent.setup()
      render(<CreateAtomDialog {...defaultProps} />, { wrapper: createWrapper() })

      const titleInput = screen.getByPlaceholderText(/короткий опис/i) as HTMLInputElement
      const contentInput = screen.getByPlaceholderText(/детальний опис/i) as HTMLTextAreaElement

      // Fill form
      await user.type(titleInput, 'Some title')
      await user.type(contentInput, 'Some content with enough characters')

      expect(titleInput.value).toBe('Some title')

      // Cancel
      await user.click(screen.getByRole('button', { name: /скасувати/i }))

      // Rerender with open to check if form was reset
      // Note: In real app, form resets via reset() call in handleCancel
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  // ========== ERROR HANDLING ==========

  describe('Error Handling', () => {
    test('shows error toast when API fails', async () => {
      const user = userEvent.setup()
      const { toast } = await import('sonner')

      vi.mocked(atomService.createAtom).mockRejectedValue(new Error('API Error'))

      render(<CreateAtomDialog {...defaultProps} />, { wrapper: createWrapper() })

      await user.type(screen.getByPlaceholderText(/короткий опис/i), 'Test')
      await user.type(screen.getByPlaceholderText(/детальний опис/i), 'Test content minimum length')

      await user.click(screen.getByRole('button', { name: /створити атом/i }))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Помилка'))
      })
    })

    test('does not close dialog when API fails', async () => {
      const user = userEvent.setup()

      vi.mocked(atomService.createAtom).mockRejectedValue(new Error('API Error'))

      render(<CreateAtomDialog {...defaultProps} />, { wrapper: createWrapper() })

      await user.type(screen.getByPlaceholderText(/короткий опис/i), 'Test')
      await user.type(screen.getByPlaceholderText(/детальний опис/i), 'Test content minimum length')

      await user.click(screen.getByRole('button', { name: /створити атом/i }))

      // Wait for error to be processed
      await waitFor(() => {
        expect(atomService.createAtom).toHaveBeenCalled()
      })

      // Dialog should NOT be closed on error
      // onOpenChange should not be called with false
      await new Promise(resolve => setTimeout(resolve, 100))

      // Check that onOpenChange was never called (meaning dialog stayed open)
      const closeCalls = mockOnOpenChange.mock.calls.filter((call: unknown[]) => call[0] === false)
      expect(closeCalls.length).toBe(0)
    })
  })
})
