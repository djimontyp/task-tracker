import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import TodaysFocus from './TodaysFocus'
import type { FocusAtom } from '../types'

const meta: Meta<typeof TodaysFocus> = {
  title: 'Features/Dashboard/TodaysFocus',
  component: TodaysFocus,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Card showing top-3 priority atoms with PENDING_REVIEW status that need user attention.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="max-w-md">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof TodaysFocus>

// Mock data factory
const createMockFocusAtoms = (count: number): FocusAtom[] => {
  const samples: FocusAtom[] = [
    {
      id: 1,
      title: 'Auth bug in login flow - users cannot sign in with Google OAuth',
      atom_type: 'TASK',
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      title: 'Update API documentation for v2 endpoints',
      atom_type: 'IDEA',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 3,
      title: 'Review PR #123 - refactor auth middleware',
      atom_type: 'QUESTION',
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 4,
      title: 'Decide on caching strategy for API responses',
      atom_type: 'DECISION',
      created_at: new Date(Date.now() - 10800000).toISOString(),
    },
    {
      id: 5,
      title: 'Performance optimization opportunity in dashboard',
      atom_type: 'INSIGHT',
      created_at: new Date(Date.now() - 14400000).toISOString(),
    },
  ]

  return samples.slice(0, count)
}

export const Default: Story = {
  args: {
    atoms: createMockFocusAtoms(3),
    isLoading: false,
  },
}

export const AllTypes: Story = {
  args: {
    atoms: [
      {
        id: 1,
        title: 'Critical: Fix memory leak in worker process',
        atom_type: 'TASK',
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        title: 'Add dark mode toggle to settings page',
        atom_type: 'IDEA',
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 3,
        title: 'Which database migration tool should we use?',
        atom_type: 'QUESTION',
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
    isLoading: false,
  },
}

export const SingleItem: Story = {
  args: {
    atoms: createMockFocusAtoms(1),
    isLoading: false,
  },
}

export const Loading: Story = {
  args: {
    atoms: [],
    isLoading: true,
  },
}

export const Empty: Story = {
  args: {
    atoms: [],
    isLoading: false,
  },
}

export const LongTitles: Story = {
  args: {
    atoms: [
      {
        id: 1,
        title:
          'This is a very long title that should be truncated with ellipsis to prevent layout issues in the card component',
        atom_type: 'TASK',
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        title:
          'Another extremely long title that demonstrates how the component handles text overflow gracefully',
        atom_type: 'IDEA',
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 3,
        title:
          'Yet another lengthy description that would normally wrap to multiple lines but we limit it',
        atom_type: 'QUESTION',
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
    ],
    isLoading: false,
  },
}

export const MoreThanThree: Story = {
  name: 'More Than 3 Items (limited)',
  args: {
    atoms: createMockFocusAtoms(5),
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Component limits display to top 3 items even when more are provided.',
      },
    },
  },
}
