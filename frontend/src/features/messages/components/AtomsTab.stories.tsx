/**
 * AtomsTab Stories
 *
 * Displays connected knowledge for a message:
 * - Entities (people, places, organizations, concepts)
 * - Keywords with relevance scores
 * - Empty states
 * - Click interactions
 */

import type { Meta, StoryObj } from '@storybook/react-vite'
import { AtomsTab } from './AtomsTab'
import type { MessageInspectData } from '@/features/messages/types'

const meta: Meta<typeof AtomsTab> = {
  title: 'Features/Messages/AtomsTab',
  component: AtomsTab,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof AtomsTab>

const fullData: MessageInspectData['atoms'] = {
  entities: {
    people: ['John Doe', 'Alice Smith', 'Bob Johnson'],
    places: ['New York', 'London'],
    organizations: ['React Team', 'Google'],
    concepts: ['Performance Optimization', 'Code Splitting', 'Lazy Loading'],
  },
  keywords: [
    { text: 'react', relevance: 95 },
    { text: 'performance', relevance: 90 },
    { text: 'optimization', relevance: 85 },
    { text: 'typescript', relevance: 80 },
    { text: 'webpack', relevance: 75 },
  ],
}

export const Default: Story = {
  args: {
    data: fullData,
  },
}

export const Empty: Story = {
  args: {
    data: {
      entities: {
        people: [],
        places: [],
        organizations: [],
        concepts: [],
      },
      keywords: [],
    },
  },
}

export const OnlyEntities: Story = {
  args: {
    data: {
      entities: {
        people: ['Alice Johnson', 'Bob Smith'],
        places: ['San Francisco', 'Berlin'],
        organizations: ['Meta', 'Microsoft'],
        concepts: ['AI', 'Machine Learning', 'Neural Networks'],
      },
      keywords: [],
    },
  },
}

export const OnlyKeywords: Story = {
  args: {
    data: {
      entities: {
        people: [],
        places: [],
        organizations: [],
        concepts: [],
      },
      keywords: [
        { text: 'react', relevance: 95 },
        { text: 'typescript', relevance: 88 },
        { text: 'vite', relevance: 82 },
        { text: 'tailwind', relevance: 75 },
        { text: 'storybook', relevance: 70 },
      ],
    },
  },
}

export const PeopleOnly: Story = {
  args: {
    data: {
      entities: {
        people: ['John Doe', 'Alice Smith', 'Bob Johnson', 'Carol White'],
        places: [],
        organizations: [],
        concepts: [],
      },
      keywords: [],
    },
  },
}

export const PlacesOnly: Story = {
  args: {
    data: {
      entities: {
        people: [],
        places: ['New York', 'London', 'Tokyo', 'San Francisco', 'Berlin'],
        organizations: [],
        concepts: [],
      },
      keywords: [],
    },
  },
}

export const OrganizationsOnly: Story = {
  args: {
    data: {
      entities: {
        people: [],
        places: [],
        organizations: ['Google', 'Meta', 'Microsoft', 'Amazon', 'Apple'],
        concepts: [],
      },
      keywords: [],
    },
  },
}

export const ConceptsOnly: Story = {
  args: {
    data: {
      entities: {
        people: [],
        places: [],
        organizations: [],
        concepts: [
          'Performance Optimization',
          'Code Splitting',
          'Lazy Loading',
          'Server-Side Rendering',
          'Static Site Generation',
        ],
      },
      keywords: [],
    },
  },
}

export const ManyKeywords: Story = {
  args: {
    data: {
      entities: {
        people: [],
        places: [],
        organizations: [],
        concepts: [],
      },
      keywords: [
        { text: 'react', relevance: 95 },
        { text: 'typescript', relevance: 92 },
        { text: 'performance', relevance: 88 },
        { text: 'optimization', relevance: 85 },
        { text: 'webpack', relevance: 82 },
        { text: 'vite', relevance: 80 },
        { text: 'tailwind', relevance: 78 },
        { text: 'storybook', relevance: 75 },
        { text: 'testing', relevance: 72 }, // Will be cut off (max 8)
        { text: 'jest', relevance: 70 },
        { text: 'vitest', relevance: 68 },
      ],
    },
  },
}

export const LowRelevanceKeywords: Story = {
  args: {
    data: {
      entities: {
        people: [],
        places: [],
        organizations: [],
        concepts: [],
      },
      keywords: [
        { text: 'minor', relevance: 35 },
        { text: 'trivial', relevance: 30 },
        { text: 'negligible', relevance: 25 },
        { text: 'barely', relevance: 20 },
      ],
    },
  },
}

export const HighRelevanceKeywords: Story = {
  args: {
    data: {
      entities: {
        people: [],
        places: [],
        organizations: [],
        concepts: [],
      },
      keywords: [
        { text: 'critical', relevance: 100 },
        { text: 'important', relevance: 98 },
        { text: 'essential', relevance: 96 },
        { text: 'vital', relevance: 94 },
      ],
    },
  },
}

export const RichData: Story = {
  args: {
    data: {
      entities: {
        people: ['John Doe', 'Alice Smith', 'Bob Johnson', 'Carol White', 'Eve Wilson'],
        places: ['New York', 'London', 'Tokyo', 'San Francisco'],
        organizations: ['Google', 'Meta', 'Microsoft', 'Amazon'],
        concepts: [
          'Performance Optimization',
          'Code Splitting',
          'Lazy Loading',
          'Server-Side Rendering',
          'Static Site Generation',
          'React Server Components',
        ],
      },
      keywords: [
        { text: 'react', relevance: 95 },
        { text: 'performance', relevance: 92 },
        { text: 'optimization', relevance: 88 },
        { text: 'typescript', relevance: 85 },
        { text: 'webpack', relevance: 82 },
        { text: 'vite', relevance: 80 },
        { text: 'tailwind', relevance: 78 },
        { text: 'storybook', relevance: 75 },
      ],
    },
  },
}

export const SparseData: Story = {
  args: {
    data: {
      entities: {
        people: ['John Doe'],
        places: [],
        organizations: [],
        concepts: ['Performance'],
      },
      keywords: [{ text: 'react', relevance: 70 }],
    },
  },
}
