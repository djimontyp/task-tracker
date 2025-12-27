import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { SearchBar, type SearchBarProps } from './index';

/**
 * Controlled wrapper to manage SearchBar state in stories
 */
const SearchBarWrapper = (props: Partial<SearchBarProps>) => {
  const [query, setQuery] = useState(props.query ?? '');
  const [isDebouncing, setIsDebouncing] = useState(false);

  // Simulate debounce behavior
  useEffect(() => {
    if (query.length >= 2) {
      setIsDebouncing(true);
      const timer = setTimeout(() => setIsDebouncing(false), 300);
      return () => clearTimeout(timer);
    }
  }, [query]);

  return (
    <SearchBar
      query={query}
      onQueryChange={setQuery}
      onClear={() => setQuery('')}
      data={props.data}
      isLoading={props.isLoading ?? false}
      isDebouncing={props.isDebouncing ?? isDebouncing}
      onSelectMessage={props.onSelectMessage ?? (() => {})}
      onSelectAtom={props.onSelectAtom ?? (() => {})}
      onSelectTopic={props.onSelectTopic ?? (() => {})}
      className={props.className}
      placeholder={props.placeholder}
    />
  );
};

const meta: Meta<typeof SearchBar> = {
  title: 'Shared/Components/SearchBar',
  component: SearchBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Presentational search input with dropdown. This is a controlled component - use SearchContainer from features/search for the full experience with API calls and navigation.',
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
  args: {
    query: '',
    onQueryChange: () => {},
    onClear: () => {},
    data: undefined,
    isLoading: false,
    isDebouncing: false,
    onSelectMessage: () => {},
    onSelectAtom: () => {},
    onSelectTopic: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof SearchBar>;

/**
 * Default empty state - ready for user input
 */
export const Default: Story = {
  render: () => <SearchBarWrapper />,
};

/**
 * With pre-filled value showing clear button
 */
export const WithValue: Story = {
  render: () => <SearchBarWrapper query="react hooks" />,
  parameters: {
    docs: {
      description: {
        story:
          'Search bar with pre-filled value "react hooks". Shows the clear button (X) on the right side. Click X to clear the input.',
      },
    },
  },
};

/**
 * Loading state with spinner
 */
export const Loading: Story = {
  render: () => <SearchBarWrapper query="searching..." isLoading={true} />,
  parameters: {
    docs: {
      description: {
        story:
          'Loading state displays during API calls. The Search icon is replaced with an animated Loader2 spinner.',
      },
    },
  },
};

/**
 * Debouncing state (user is typing)
 */
export const Debouncing: Story = {
  render: () => <SearchBarWrapper query="typ" isDebouncing={true} />,
  parameters: {
    docs: {
      description: {
        story:
          'Debouncing state appears while user is still typing. Shows spinner to indicate pending search.',
      },
    },
  },
};

/**
 * Interactive demo: type to see loading, click X to clear
 */
export const Interactive: Story = {
  render: () => <SearchBarWrapper />,
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo: 1) Type 2+ characters to see loading spinner, 2) Wait 300ms to see spinner stop, 3) Click X to clear input.',
      },
    },
  },
};

/**
 * Custom placeholder
 */
export const CustomPlaceholder: Story = {
  render: () => <SearchBarWrapper placeholder="Find topics, messages..." />,
  parameters: {
    docs: {
      description: {
        story: 'Search bar with custom placeholder text.',
      },
    },
  },
};

/**
 * Mobile responsive view
 */
export const Mobile: Story = {
  render: () => <SearchBarWrapper />,
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
  render: () => <SearchBarWrapper />,
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Search bar in dark mode using semantic tokens (text-muted-foreground)',
      },
    },
  },
};
