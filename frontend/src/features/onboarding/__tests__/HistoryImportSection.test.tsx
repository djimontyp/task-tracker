import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HistoryImportSection } from '../components/HistoryImportSection';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'import.title': 'Import Message History',
        'import.description': 'Import historical messages from connected groups.',
        'import.depth.label': 'How far back?',
        'onboarding.import.depth.skip': 'Skip import',
        'onboarding.import.depth.24h': 'Last 24 hours',
        'onboarding.import.depth.7d': 'Last 7 days',
        'onboarding.import.depth.30d': 'Last 30 days',
        'onboarding.import.depth.all': 'All available',
        'import.depth.recommended': 'Recommended',
        'import.estimate.info': 'Counts fetched from Telegram. May vary slightly.',
        'import.estimate.messagesLabel': 'messages',
        'import.warning.all':
          'This may hit Telegram API rate limits and require longer processing time.',
        'import.actions.start': 'Start Import',
        'import.actions.startAnyway': 'Start Import Anyway',
        'import.actions.starting': 'Starting...',
      };
      return translations[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock hooks
vi.mock('../hooks/useMessageEstimate', () => ({
  useMessageEstimate: vi.fn(() => ({
    isLoading: false,
    isError: false,
    isRateLimited: false,
    retryAfter: null,
    refetch: vi.fn(),
    getCountForDepth: (depth: string) => {
      const counts: Record<string, number> = {
        '24h': 47,
        '7d': 312,
        '30d': 1489,
        all: 4721,
      };
      return counts[depth] ?? null;
    },
  })),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('HistoryImportSection', () => {
  const mockOnStartImport = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with title and description', () => {
    render(<HistoryImportSection onStartImport={mockOnStartImport} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Import Message History')).toBeInTheDocument();
    expect(
      screen.getByText('Import historical messages from connected groups.')
    ).toBeInTheDocument();
  });

  it('should render all depth options', () => {
    render(<HistoryImportSection onStartImport={mockOnStartImport} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Skip import')).toBeInTheDocument();
    expect(screen.getByText('Last 24 hours')).toBeInTheDocument();
    expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
    expect(screen.getByText('All available')).toBeInTheDocument();
  });

  it('should show message counts for each option', () => {
    render(<HistoryImportSection onStartImport={mockOnStartImport} />, {
      wrapper: createWrapper(),
    });

    // Check that message counts are displayed (may or may not have comma based on locale)
    expect(screen.getByText(/47/)).toBeInTheDocument();
    expect(screen.getByText(/312/)).toBeInTheDocument();
    // Numbers over 1000 - use getAllByText since there might be multiple elements
    const largeNumbers = screen.getAllByText(/\d{1,3}[,\s]?\d{3}/);
    expect(largeNumbers.length).toBeGreaterThanOrEqual(2);
  });

  it('should have 7d selected by default with Recommended badge', () => {
    render(<HistoryImportSection onStartImport={mockOnStartImport} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Recommended')).toBeInTheDocument();
    // Find the radio by its id
    const radio7d = document.getElementById('depth-7d');
    expect(radio7d).toHaveAttribute('data-state', 'checked');
  });

  it('should call onStartImport with selected depth when button clicked', () => {
    render(<HistoryImportSection onStartImport={mockOnStartImport} />, {
      wrapper: createWrapper(),
    });

    const startButton = screen.getByRole('button', { name: /start import/i });
    fireEvent.click(startButton);

    expect(mockOnStartImport).toHaveBeenCalledWith('7d');
  });

  it('should change depth selection on radio click', () => {
    render(<HistoryImportSection onStartImport={mockOnStartImport} />, {
      wrapper: createWrapper(),
    });

    // Click the label for 30d option
    const label30d = screen.getByText('Last 30 days');
    fireEvent.click(label30d);

    const startButton = screen.getByRole('button', { name: /start import/i });
    fireEvent.click(startButton);

    expect(mockOnStartImport).toHaveBeenCalledWith('30d');
  });

  it('should show warning when All option is selected', () => {
    render(<HistoryImportSection onStartImport={mockOnStartImport} />, {
      wrapper: createWrapper(),
    });

    // Click the label for "All available" option
    const labelAll = screen.getByText('All available');
    fireEvent.click(labelAll);

    expect(
      screen.getByText(
        'This may hit Telegram API rate limits and require longer processing time.'
      )
    ).toBeInTheDocument();
  });

  it('should disable button when disabled prop is true', () => {
    render(
      <HistoryImportSection onStartImport={mockOnStartImport} disabled />,
      { wrapper: createWrapper() }
    );

    const startButton = screen.getByRole('button', { name: /start import/i });
    expect(startButton).toBeDisabled();
  });

  it('should show loading state when isStarting is true', () => {
    render(
      <HistoryImportSection onStartImport={mockOnStartImport} isStarting />,
      { wrapper: createWrapper() }
    );

    expect(
      screen.getByRole('button', { name: /starting/i })
    ).toBeInTheDocument();
  });

  it('should have 44px height on start button for touch target', () => {
    render(<HistoryImportSection onStartImport={mockOnStartImport} />, {
      wrapper: createWrapper(),
    });

    const startButton = screen.getByRole('button', { name: /start import/i });
    expect(startButton).toHaveClass('h-11');
  });
});
