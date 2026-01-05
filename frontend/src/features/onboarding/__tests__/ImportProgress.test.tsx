import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { ImportProgress } from '../components/ImportProgress';
import type { ImportProgress as ImportProgressData } from '../types';

// Initialize i18n for tests
i18n.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      onboarding: {
        import: {
          progress: {
            importing: 'Importing...',
            completed: 'Import Completed',
            failed: 'Import Failed',
            cancelled: 'Import Cancelled',
            pending: 'Pending',
            progress: 'Progress',
            progressLabel: '{{percent}}% complete',
            fetched: 'Fetched',
            fetchedDesc: '(from API)',
            stored: 'Stored',
            storedDesc: '(new)',
            skipped: 'Skipped',
            skippedDesc: '(duplicates)',
            skippedTooltip:
              'Skipped messages are duplicates that already exist in the database.',
            elapsed: 'Elapsed',
          },
          actions: {
            cancel: 'Cancel Import',
            cancelling: 'Cancelling...',
          },
        },
      },
    },
  },
});

function Wrapper({ children }: { children: React.ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

describe('ImportProgress', () => {
  const mockOnCancel = vi.fn();

  const mockProgress: ImportProgressData = {
    status: 'running',
    progress_percent: 67,
    fetched: 234,
    stored: 220,
    skipped: 14,
    elapsed_seconds: 83, // 1:23
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render progress bar with correct percentage', () => {
    render(
      <ImportProgress progress={mockProgress} status="running" />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('67%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '67');
  });

  it('should render all three metric cards', () => {
    render(
      <ImportProgress progress={mockProgress} status="running" />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('Fetched')).toBeInTheDocument();
    expect(screen.getByText('234')).toBeInTheDocument();

    expect(screen.getByText('Stored')).toBeInTheDocument();
    expect(screen.getByText('220')).toBeInTheDocument();

    expect(screen.getByText('Skipped')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
  });

  it('should format elapsed time correctly', () => {
    render(
      <ImportProgress progress={mockProgress} status="running" />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('1:23')).toBeInTheDocument();
  });

  it('should show cancel button when importing', () => {
    render(
      <ImportProgress
        progress={mockProgress}
        status="running"
        onCancel={mockOnCancel}
      />,
      { wrapper: Wrapper }
    );

    const cancelButton = screen.getByRole('button', { name: /cancel import/i });
    expect(cancelButton).toBeInTheDocument();
  });

  it('should call onCancel when cancel button clicked', () => {
    render(
      <ImportProgress
        progress={mockProgress}
        status="running"
        onCancel={mockOnCancel}
      />,
      { wrapper: Wrapper }
    );

    const cancelButton = screen.getByRole('button', { name: /cancel import/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should hide cancel button when completed', () => {
    render(
      <ImportProgress
        progress={{ ...mockProgress, status: 'completed', progress_percent: 100 }}
        status="completed"
        onCancel={mockOnCancel}
      />,
      { wrapper: Wrapper }
    );

    expect(
      screen.queryByRole('button', { name: /cancel import/i })
    ).not.toBeInTheDocument();
  });

  it('should show completed title when status is completed', () => {
    render(
      <ImportProgress
        progress={{ ...mockProgress, status: 'completed', progress_percent: 100 }}
        status="completed"
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('Import Completed')).toBeInTheDocument();
  });

  it('should show failed title and error message when status is failed', () => {
    const failedProgress: ImportProgressData = {
      ...mockProgress,
      status: 'failed',
      error_message: 'Connection timeout',
    };

    render(
      <ImportProgress progress={failedProgress} status="failed" />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('Import Failed')).toBeInTheDocument();
    expect(screen.getByText('Connection timeout')).toBeInTheDocument();
  });

  it('should show cancelling state when isCancelling is true', () => {
    render(
      <ImportProgress
        progress={mockProgress}
        status="running"
        onCancel={mockOnCancel}
        isCancelling
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByRole('button', { name: /cancelling/i })).toBeDisabled();
  });

  it('should have 44px height on cancel button for touch target', () => {
    render(
      <ImportProgress
        progress={mockProgress}
        status="running"
        onCancel={mockOnCancel}
      />,
      { wrapper: Wrapper }
    );

    const cancelButton = screen.getByRole('button', { name: /cancel import/i });
    expect(cancelButton).toHaveClass('h-11');
  });

  it('should handle null progress gracefully', () => {
    render(
      <ImportProgress progress={null} status="pending" />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('0:00')).toBeInTheDocument();
  });
});
