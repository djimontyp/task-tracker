import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SearchBar, type SearchBarProps } from './index';

// Default mock props for controlled component
const createMockProps = (overrides: Partial<SearchBarProps> = {}): SearchBarProps => ({
  query: '',
  onQueryChange: vi.fn(),
  onClear: vi.fn(),
  data: undefined,
  isLoading: false,
  isDebouncing: false,
  onSelectMessage: vi.fn(),
  onSelectAtom: vi.fn(),
  onSelectTopic: vi.fn(),
  ...overrides,
});

const renderSearchBar = (props: SearchBarProps) => {
  return render(
    <MemoryRouter>
      <SearchBar {...props} />
    </MemoryRouter>
  );
};

describe('SearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // BASIC RENDERING
  test('renders input with correct placeholder', () => {
    renderSearchBar(createMockProps());

    const input = screen.getByPlaceholderText('Search... (/)');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('id', 'global-search');
    expect(input).toHaveAttribute('aria-label', 'Search topics, messages, and atoms');
  });

  test('renders custom placeholder', () => {
    renderSearchBar(createMockProps({ placeholder: 'Custom placeholder' }));

    const input = screen.getByPlaceholderText('Custom placeholder');
    expect(input).toBeInTheDocument();
  });

  test('renders Search icon by default', () => {
    renderSearchBar(createMockProps());

    // Search icon should be present (via className)
    const iconContainer = document.querySelector('.absolute.left-4');
    expect(iconContainer).toBeInTheDocument();
  });

  test('displays the provided query value', () => {
    renderSearchBar(createMockProps({ query: 'test value' }));

    const input = screen.getByPlaceholderText('Search... (/)');
    expect(input).toHaveValue('test value');
  });

  // CLEAR BUTTON TESTS
  test('does not show clear button when input is empty', () => {
    renderSearchBar(createMockProps({ query: '' }));

    const clearButton = screen.queryByLabelText('Clear search');
    expect(clearButton).not.toBeInTheDocument();
  });

  test('shows clear button when query has value', () => {
    renderSearchBar(createMockProps({ query: 'test query' }));

    const clearButton = screen.getByLabelText('Clear search');
    expect(clearButton).toBeInTheDocument();
  });

  test('calls onClear when clear button clicked', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    renderSearchBar(createMockProps({ query: 'test query', onClear }));

    const clearButton = screen.getByLabelText('Clear search');
    await user.click(clearButton);

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  test('clear button has correct styling', () => {
    renderSearchBar(createMockProps({ query: 'test' }));

    const clearButton = screen.getByLabelText('Clear search');
    // Updated to match WCAG 44px touch target (h-11 w-11) and right-1 positioning
    expect(clearButton).toHaveClass('absolute', 'right-1', 'top-1/2', '-translate-y-1/2');
    expect(clearButton).toHaveClass('h-11', 'w-11');
  });

  // LOADING INDICATOR TESTS
  test('shows Search icon when not loading', () => {
    renderSearchBar(createMockProps({ isLoading: false, isDebouncing: false }));

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).not.toBeInTheDocument();
  });

  test('shows loading spinner when isLoading is true', () => {
    renderSearchBar(createMockProps({ isLoading: true }));

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  test('shows loading spinner when isDebouncing is true', () => {
    renderSearchBar(createMockProps({ isDebouncing: true }));

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  test('loading indicator has correct styling', () => {
    renderSearchBar(createMockProps({ isLoading: true }));

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toHaveClass('absolute', 'left-4', 'top-1/2', '-translate-y-1/2');
    expect(spinner).toHaveClass('h-4', 'w-4');
  });

  // INPUT HANDLING TESTS
  test('calls onQueryChange when typing', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    renderSearchBar(createMockProps({ onQueryChange }));

    const input = screen.getByPlaceholderText('Search... (/)');
    await user.type(input, 'abc');

    expect(onQueryChange).toHaveBeenCalledTimes(3);
    expect(onQueryChange).toHaveBeenNthCalledWith(1, 'a');
    expect(onQueryChange).toHaveBeenNthCalledWith(2, 'b');
    expect(onQueryChange).toHaveBeenNthCalledWith(3, 'c');
  });

  // KEYBOARD SHORTCUT TESTS
  test('focuses input when "/" key is pressed', async () => {
    renderSearchBar(createMockProps());

    const input = screen.getByPlaceholderText('Search... (/)');

    // Simulate "/" key press on window directly
    const event = new KeyboardEvent('keydown', { key: '/', bubbles: true });
    await act(async () => {
      window.dispatchEvent(event);
    });

    expect(input).toHaveFocus();
  });

  test('does not focus input when "/" pressed inside input field', async () => {
    const user = userEvent.setup();
    renderSearchBar(createMockProps());

    const input = screen.getByPlaceholderText('Search... (/)');

    // Focus input first and type
    await user.click(input);
    await user.keyboard('/');

    // "/" should trigger onQueryChange, not global focus
    expect(input).toHaveFocus();
  });

  // ACCESSIBILITY TESTS
  test('input has correct aria-label', () => {
    renderSearchBar(createMockProps());

    const input = screen.getByPlaceholderText('Search... (/)');
    expect(input).toHaveAttribute('aria-label', 'Search topics, messages, and atoms');
  });

  test('clear button has correct aria-label', () => {
    renderSearchBar(createMockProps({ query: 'test' }));

    const clearButton = screen.getByLabelText('Clear search');
    expect(clearButton).toHaveAttribute('aria-label', 'Clear search');
  });

  test('input is keyboard accessible', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    renderSearchBar(createMockProps({ onQueryChange }));

    const input = screen.getByPlaceholderText('Search... (/)');

    // Tab to input
    await user.tab();
    expect(input).toHaveFocus();
  });

  // CLASSNAME TESTS
  test('applies custom className', () => {
    renderSearchBar(createMockProps({ className: 'custom-class' }));

    const container = document.querySelector('.relative.custom-class');
    expect(container).toBeInTheDocument();
  });
});
