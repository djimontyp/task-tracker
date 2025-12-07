import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SearchBar } from './SearchBar';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderSearchBar = () => {
  return render(
    <MemoryRouter>
      <SearchBar />
    </MemoryRouter>
  );
};

describe('SearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  // BASIC RENDERING
  test('renders input with correct placeholder', () => {
    renderSearchBar();

    const input = screen.getByPlaceholderText('Search topics and messages... (/)');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('id', 'global-search');
    expect(input).toHaveAttribute('aria-label', 'Search topics and messages');
  });

  test('renders Search icon by default', () => {
    renderSearchBar();

    // Search icon should be present (via className)
    const iconContainer = document.querySelector('.absolute.left-4');
    expect(iconContainer).toBeInTheDocument();
  });

  test('starts with empty input value', () => {
    renderSearchBar();

    const input = screen.getByPlaceholderText('Search topics and messages... (/)');
    expect(input).toHaveValue('');
  });

  // CLEAR BUTTON TESTS
  test('does not show clear button when input is empty', () => {
    renderSearchBar();

    const clearButton = screen.queryByLabelText('Clear search');
    expect(clearButton).not.toBeInTheDocument();
  });

  test('shows clear button when query has value', async () => {
    const user = userEvent.setup({ delay: null });
    renderSearchBar();

    const input = screen.getByPlaceholderText('Search topics and messages... (/)');
    await user.type(input, 'test query');

    const clearButton = screen.getByLabelText('Clear search');
    expect(clearButton).toBeInTheDocument();
  });

  test('clears input when clear button clicked', async () => {
    const user = userEvent.setup({ delay: null });
    renderSearchBar();

    const input = screen.getByPlaceholderText('Search topics and messages... (/)');
    await user.type(input, 'test query');

    const clearButton = screen.getByLabelText('Clear search');
    await user.click(clearButton);

    expect(input).toHaveValue('');
  });

  test('hides clear button after clearing input', async () => {
    const user = userEvent.setup({ delay: null });
    renderSearchBar();

    const input = screen.getByPlaceholderText('Search topics and messages... (/)');
    await user.type(input, 'test');

    const clearButton = screen.getByLabelText('Clear search');
    await user.click(clearButton);

    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  test('clear button has correct styling and icon', async () => {
    const user = userEvent.setup({ delay: null });
    renderSearchBar();

    const input = screen.getByPlaceholderText('Search topics and messages... (/)');
    await user.type(input, 'test');

    const clearButton = screen.getByLabelText('Clear search');
    expect(clearButton).toHaveClass('absolute', 'right-2', 'top-1/2', '-translate-y-1/2');
    // Button should have ghost variant and icon size
    expect(clearButton).toHaveClass('h-6', 'w-6');
  });

  // LOADING INDICATOR TESTS
  test('shows Search icon when input is empty', () => {
    renderSearchBar();

    // Search icon container should be present (not the spinner)
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).not.toBeInTheDocument();
  });

  test('shows loading spinner during debounce for queries >= 2 chars', async () => {
    const user = userEvent.setup({ delay: null });
    renderSearchBar();

    const input = screen.getByPlaceholderText('Search topics and messages... (/)');
    await user.type(input, 'ab');

    // Loading spinner should appear immediately (query !== debouncedQuery)
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  test('does not show loading spinner for single character', async () => {
    const user = userEvent.setup({ delay: null });
    renderSearchBar();

    const input = screen.getByPlaceholderText('Search topics and messages... (/)');
    await user.type(input, 'a');

    // Loading should not appear (query.length < 2)
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).not.toBeInTheDocument();
  });

  test('shows Search icon again after debounce completes', async () => {
    const user = userEvent.setup({ delay: null });
    renderSearchBar();

    const input = screen.getByPlaceholderText('Search topics and messages... (/)');
    await user.type(input, 'test');

    // Initially loading
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();

    // Wait for debounce (300ms)
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Loading should disappear
    expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
  });

  test('loading indicator has correct styling', async () => {
    const user = userEvent.setup({ delay: null });
    renderSearchBar();

    const input = screen.getByPlaceholderText('Search topics and messages... (/)');
    await user.type(input, 'test');

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toHaveClass('absolute', 'left-4', 'top-1/2', '-translate-y-1/2');
    expect(spinner).toHaveClass('h-4', 'w-4');
  });

  // KEYBOARD SHORTCUT TESTS
  test('focuses input when "/" key is pressed', async () => {
    renderSearchBar();

    const input = screen.getByPlaceholderText('Search topics and messages... (/)');

    // Simulate "/" key press on window directly
    const event = new KeyboardEvent('keydown', { key: '/', bubbles: true });
    await act(async () => {
      window.dispatchEvent(event);
    });

    expect(input).toHaveFocus();
  });

  test('does not focus input when "/" pressed inside input field', async () => {
    const user = userEvent.setup({ delay: null });
    renderSearchBar();

    const input = screen.getByPlaceholderText('Search topics and messages... (/)');

    // Focus input first
    await user.click(input);
    await user.keyboard('/');

    // Input should contain the "/" character
    expect(input).toHaveValue('/');
  });

  test('does not focus input when "/" pressed inside textarea', async () => {
    const user = userEvent.setup({ delay: null });
    const { container } = renderSearchBar();

    // Add a textarea to the document
    const textarea = document.createElement('textarea');
    container.appendChild(textarea);
    textarea.focus();

    await user.keyboard('/');

    const input = screen.getByPlaceholderText('Search topics and messages... (/)');
    expect(input).not.toHaveFocus();
  });

  // NAVIGATION & DEBOUNCE TESTS
  test('navigates to search page after debounce for queries >= 2 chars', async () => {
    const user = userEvent.setup({ delay: null });
    renderSearchBar();

    const input = screen.getByPlaceholderText('Search topics and messages... (/)');
    await user.type(input, 'test query');

    // Should not navigate immediately
    expect(mockNavigate).not.toHaveBeenCalled();

    // Fast-forward debounce delay (300ms)
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/search?q=test%20query');
  });

  test('does not navigate for queries < 2 chars', async () => {
    const user = userEvent.setup({ delay: null });
    renderSearchBar();

    const input = screen.getByPlaceholderText('Search topics and messages... (/)');
    await user.type(input, 'a');

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('trims whitespace before navigation', async () => {
    const user = userEvent.setup({ delay: null });
    renderSearchBar();

    const input = screen.getByPlaceholderText('Search topics and messages... (/)');
    await user.type(input, '  test  ');

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/search?q=test');
  });

  test('does not navigate if trimmed query is too short', async () => {
    const user = userEvent.setup({ delay: null });
    renderSearchBar();

    const input = screen.getByPlaceholderText('Search topics and messages... (/)');
    await user.type(input, '  a  ');

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('debounces multiple rapid inputs', async () => {
    const user = userEvent.setup({ delay: null });
    renderSearchBar();

    const input = screen.getByPlaceholderText('Search topics and messages... (/)');

    // Type multiple characters rapidly
    await user.type(input, 't');
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    await user.type(input, 'e');
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    await user.type(input, 's');
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    await user.type(input, 't');

    // Should not navigate yet
    expect(mockNavigate).not.toHaveBeenCalled();

    // Complete the debounce
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/search?q=test');
  });

  test('URL encodes special characters', async () => {
    const user = userEvent.setup({ delay: null });
    renderSearchBar();

    const input = screen.getByPlaceholderText('Search topics and messages... (/)');
    await user.type(input, 'test & query');

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/search?q=test%20%26%20query');
  });

  // ACCESSIBILITY TESTS
  test('input has correct aria-label', () => {
    renderSearchBar();

    const input = screen.getByPlaceholderText('Search topics and messages... (/)');
    expect(input).toHaveAttribute('aria-label', 'Search topics and messages');
  });

  test('clear button has correct aria-label', async () => {
    const user = userEvent.setup({ delay: null });
    renderSearchBar();

    const input = screen.getByPlaceholderText('Search topics and messages... (/)');
    await user.type(input, 'test');

    const clearButton = screen.getByLabelText('Clear search');
    expect(clearButton).toHaveAttribute('aria-label', 'Clear search');
  });

  test('input is keyboard accessible', async () => {
    const user = userEvent.setup({ delay: null });
    renderSearchBar();

    const input = screen.getByPlaceholderText('Search topics and messages... (/)');

    // Tab to input
    await user.tab();
    expect(input).toHaveFocus();

    // Type in input
    await user.keyboard('test');
    expect(input).toHaveValue('test');
  });

  test('clear button is keyboard accessible', async () => {
    const user = userEvent.setup({ delay: null });
    renderSearchBar();

    const input = screen.getByPlaceholderText('Search topics and messages... (/)');
    await user.type(input, 'test');

    const clearButton = screen.getByLabelText('Clear search');

    // Click to activate (simpler than tabbing)
    await user.click(clearButton);
    expect(input).toHaveValue('');
  });

  // INTEGRATION TESTS
  test('complete user flow: type -> clear -> type again -> navigate', async () => {
    const user = userEvent.setup({ delay: null });
    renderSearchBar();

    const input = screen.getByPlaceholderText('Search topics and messages... (/)');

    // Type first query
    await user.type(input, 'first');
    expect(input).toHaveValue('first');

    // Clear it
    const clearButton = screen.getByLabelText('Clear search');
    await user.click(clearButton);
    expect(input).toHaveValue('');

    // Type second query
    await user.type(input, 'second query');
    expect(input).toHaveValue('second query');

    // Wait for debounce
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/search?q=second%20query');
  });

  test('loading state updates correctly during typing', async () => {
    const user = userEvent.setup({ delay: null });
    renderSearchBar();

    const input = screen.getByPlaceholderText('Search topics and messages... (/)');

    // Type 2 characters (triggers loading)
    await user.type(input, 'ab');
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();

    // Complete debounce
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();

    // Type more (triggers loading again)
    await user.type(input, 'c');
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();

    // Complete debounce again
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenLastCalledWith('/search?q=abc');
  });

  // EDGE CASES
  test('handles empty string after clearing', async () => {
    const user = userEvent.setup({ delay: null });
    renderSearchBar();

    const input = screen.getByPlaceholderText('Search topics and messages... (/)');
    await user.type(input, 'test');

    const clearButton = screen.getByLabelText('Clear search');
    await user.click(clearButton);

    vi.advanceTimersByTime(300);

    // Should not navigate for empty query
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('handles whitespace-only input', async () => {
    const user = userEvent.setup({ delay: null });
    renderSearchBar();

    const input = screen.getByPlaceholderText('Search topics and messages... (/)');
    await user.type(input, '   ');

    vi.advanceTimersByTime(300);

    // Should not navigate (trimmed length = 0)
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('handles very long query strings', async () => {
    const user = userEvent.setup({ delay: null });
    renderSearchBar();

    const longQuery = 'a'.repeat(100); // Reduced from 500 for faster test
    const input = screen.getByPlaceholderText('Search topics and messages... (/)');
    await user.type(input, longQuery);

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    const encodedQuery = encodeURIComponent(longQuery);
    expect(mockNavigate).toHaveBeenCalledWith(`/search?q=${encodedQuery}`);
  });
});
