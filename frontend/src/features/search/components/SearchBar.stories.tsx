import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { SearchBar } from './SearchBar';

/**
 * Controlled wrapper to demonstrate SearchBar with pre-filled value
 * Shows the clear button (X) when query has content
 */
const SearchBarWithValue = () => {
  const [query, setQuery] = useState('react hooks');

  const handleClear = () => {
    setQuery('');
  };

  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        id="global-search"
        type="text"
        placeholder="Search topics and messages... (/)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={`pl-10 w-64 ${query.length > 0 ? 'pr-8' : ''}`}
        aria-label="Search topics and messages"
      />
      {query.length > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

/**
 * Static display of loading state
 * Shows the Loader2 spinner instead of Search icon
 */
const SearchBarLoading = () => {
  return (
    <div className="relative">
      <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none animate-spin" />
      <Input
        id="global-search"
        type="text"
        placeholder="Search topics and messages... (/)"
        value="searching..."
        readOnly
        className="pl-10 w-64 pr-8"
        aria-label="Search topics and messages"
      />
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
        aria-label="Clear search"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

/**
 * Interactive wrapper demonstrating clear functionality
 * Type to see clear button appear, click X to clear
 */
const SearchBarInteractive = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Simulate debounce behavior for loading state demo
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const isLoading = query !== debouncedQuery && query.length >= 2;

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
  };

  return (
    <div className="relative">
      {isLoading ? (
        <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none animate-spin" />
      ) : (
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      )}
      <Input
        id="global-search"
        type="text"
        placeholder="Search topics and messages... (/)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={`pl-10 w-64 ${query.length > 0 ? 'pr-8' : ''}`}
        aria-label="Search topics and messages"
      />
      {query.length > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

const meta: Meta<typeof SearchBar> = {
  title: 'Features/Search/SearchBar',
  component: SearchBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Global search input with keyboard shortcut (/) support. Searches topics and messages with 300ms debounce. Navigates to search results page when query is 2+ characters.',
      },
    },
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div className="w-80 p-4">
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SearchBar>;

/**
 * Default empty state - ready for user input
 */
export const Default: Story = {};

/**
 * Empty state with focus hint
 */
export const WithFocusHint: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Search bar with placeholder showing keyboard shortcut hint (press "/" to focus)',
      },
    },
  },
};

/**
 * Accessibility features
 */
export const Accessibility: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Search bar with accessible features: aria-label, keyboard shortcut (/) support, icon with pointer-events-none',
      },
    },
  },
};

/**
 * Mobile responsive view
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Search bar adapts to mobile viewports with reduced width (w-64 = 16rem)',
      },
    },
  },
};

/**
 * Dark mode variant
 */
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Search bar in dark mode using semantic tokens (text-muted-foreground)',
      },
    },
  },
};

/**
 * Search bar with pre-filled value showing the clear button (X)
 * Demonstrates the dynamic padding (pr-8) when text is present
 */
export const WithValue: Story = {
  render: () => <SearchBarWithValue />,
  parameters: {
    docs: {
      description: {
        story:
          'Search bar with pre-filled value "react hooks". Shows the clear button (X) on the right side. Click X to clear the input. Note the dynamic padding adjustment.',
      },
    },
  },
};

/**
 * Loading state with spinner
 * Shows Loader2 spinner instead of Search icon during debounce
 */
export const Loading: Story = {
  render: () => <SearchBarLoading />,
  parameters: {
    docs: {
      description: {
        story:
          'Loading state displayed during the 300ms debounce period. The Search icon is replaced with an animated Loader2 spinner. This state appears when query !== debouncedQuery && query.length >= 2.',
      },
    },
  },
};

/**
 * Interactive demo: type to see loading, click X to clear
 * Full demonstration of all new features
 */
export const Interactive: Story = {
  render: () => <SearchBarInteractive />,
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo showcasing all features: 1) Type 2+ characters to see loading spinner, 2) Wait 300ms to see spinner stop, 3) Click X to clear input. This story does not navigate to search results.',
      },
    },
  },
};
