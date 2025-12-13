import type { Meta, StoryObj } from '@storybook/react'
import { Command, CommandList, CommandGroup } from '@/shared/ui/command'
import { MessageSearchItem } from './MessageSearchItem'
import { AtomSearchItem } from './AtomSearchItem'
import { TopicSearchItem } from './TopicSearchItem'
import type { FTSMessageResult, FTSAtomResult, FTSTopicResult } from '../types/fts'

// Wrapper for Command items
const CommandWrapper = ({ children }: { children: React.ReactNode }) => (
  <Command className="rounded-lg border shadow-md w-[400px]">
    <CommandList>
      <CommandGroup>
        {children}
      </CommandGroup>
    </CommandList>
  </Command>
)

// Message Search Item
const messageStoryMeta: Meta<typeof MessageSearchItem> = {
  title: 'Features/Search/SearchResultItems/MessageSearchItem',
  component: MessageSearchItem,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <CommandWrapper>
        <Story />
      </CommandWrapper>
    ),
  ],
}

export default messageStoryMeta
type MessageStory = StoryObj<typeof MessageSearchItem>

const mockMessage: FTSMessageResult = {
  id: '1',
  content_snippet: 'We need to implement <mark>authentication</mark> for the new API endpoints before the release deadline',
  author: 'John Doe',
  timestamp: new Date().toISOString(),
  topic: { id: '1', name: 'API Development' },
  rank: 0.92,
}

export const Default: MessageStory = {
  args: {
    message: mockMessage,
  },
}

export const WithLongContent: MessageStory = {
  args: {
    message: {
      ...mockMessage,
      content_snippet: 'This is a very long message that contains multiple <mark>highlighted</mark> keywords and should be truncated properly to fit within the search result item. The <mark>authentication</mark> system needs to handle various edge cases.',
    },
  },
}

export const WithoutTopic: MessageStory = {
  args: {
    message: {
      ...mockMessage,
      topic: null,
    },
  },
}

export const OldMessage: MessageStory = {
  args: {
    message: {
      ...mockMessage,
      timestamp: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
    },
  },
}

// Atom Search Item Stories (separate file would be cleaner but keeping together for simplicity)

const mockAtom: FTSAtomResult = {
  id: '1',
  title: 'JWT Token Validation',
  content_snippet: 'Implement <mark>authentication</mark> token validation using RS256',
  type: 'solution',
  user_approved: true,
  rank: 0.90,
}

export const AtomSolution: StoryObj<typeof AtomSearchItem> = {
  render: () => (
    <CommandWrapper>
      <AtomSearchItem atom={mockAtom} />
    </CommandWrapper>
  ),
}

export const AtomProblem: StoryObj<typeof AtomSearchItem> = {
  render: () => (
    <CommandWrapper>
      <AtomSearchItem atom={{ ...mockAtom, type: 'problem', title: 'Auth Token Expiry Issue' }} />
    </CommandWrapper>
  ),
}

export const AtomQuestion: StoryObj<typeof AtomSearchItem> = {
  render: () => (
    <CommandWrapper>
      <AtomSearchItem atom={{ ...mockAtom, type: 'question', title: 'How to refresh tokens?' }} />
    </CommandWrapper>
  ),
}

export const AtomDecision: StoryObj<typeof AtomSearchItem> = {
  render: () => (
    <CommandWrapper>
      <AtomSearchItem atom={{ ...mockAtom, type: 'decision', title: 'Use OAuth2 for auth' }} />
    </CommandWrapper>
  ),
}

export const AtomInsight: StoryObj<typeof AtomSearchItem> = {
  render: () => (
    <CommandWrapper>
      <AtomSearchItem atom={{ ...mockAtom, type: 'insight', title: 'Session tokens improve UX' }} />
    </CommandWrapper>
  ),
}

export const AtomNotApproved: StoryObj<typeof AtomSearchItem> = {
  render: () => (
    <CommandWrapper>
      <AtomSearchItem atom={{ ...mockAtom, user_approved: false }} />
    </CommandWrapper>
  ),
}

// Topic Search Item Stories

const mockTopic: FTSTopicResult = {
  id: '1',
  name: 'User Authentication',
  description: 'OAuth and JWT authentication flows',
  match_snippet: 'OAuth and JWT <mark>authentication</mark> flows for secure user sessions',
  rank: 0.95,
}

export const Topic: StoryObj<typeof TopicSearchItem> = {
  render: () => (
    <CommandWrapper>
      <TopicSearchItem topic={mockTopic} />
    </CommandWrapper>
  ),
}

export const TopicWithoutDescription: StoryObj<typeof TopicSearchItem> = {
  render: () => (
    <CommandWrapper>
      <TopicSearchItem topic={{ ...mockTopic, description: null }} />
    </CommandWrapper>
  ),
}

export const TopicLongName: StoryObj<typeof TopicSearchItem> = {
  render: () => (
    <CommandWrapper>
      <TopicSearchItem topic={{ ...mockTopic, name: 'Very Long Topic Name That Should Be Handled Properly' }} />
    </CommandWrapper>
  ),
}
