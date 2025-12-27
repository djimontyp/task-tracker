import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'
import RecentInsights from './RecentInsights'
import { createMockInsights, EMPTY_INSIGHTS } from '../mocks/dashboardMocks'

const meta: Meta<typeof RecentInsights> = {
  title: 'Features/Dashboard/RecentInsights',
  component: RecentInsights,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Timeline-based display of recent important insights with colored dots by type.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="max-w-2xl">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof RecentInsights>

export const Default: Story = {
  args: {
    data: createMockInsights(5),
    isLoading: false,
  },
}

export const AllTypes: Story = {
  args: {
    data: [
      {
        id: '1',
        type: 'PROBLEM',
        title: 'Критична помилка на продакшені',
        content: 'Сервер повертає 500 помилки при авторизації.',
        author: 'petro',
        topicName: 'Backend',
        topicId: 'topic-1',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        type: 'SOLUTION',
        title: 'Оновити React до версії 19',
        content: 'Потрібно оновити залежності та перевірити сумісність.',
        author: 'maria',
        topicName: 'Frontend',
        topicId: 'topic-2',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: '3',
        type: 'INSIGHT',
        title: 'Додати темну тему',
        content: 'Користувачі просять dark mode для роботи ввечері.',
        author: 'olena',
        topicName: 'UI/UX',
        topicId: 'topic-3',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: '4',
        type: 'DECISION',
        title: 'Використовуємо PostgreSQL',
        content: 'Вибір бази даних зроблено на користь PostgreSQL.',
        author: 'ivan',
        topicName: 'Architecture',
        topicId: 'topic-4',
        createdAt: new Date(Date.now() - 10800000).toISOString(),
      },
      {
        id: '5',
        type: 'QUESTION',
        title: 'Який CI/CD обрати?',
        content: 'GitHub Actions vs GitLab CI — потрібен аналіз.',
        author: 'andriy',
        topicName: 'DevOps',
        topicId: 'topic-5',
        createdAt: new Date(Date.now() - 14400000).toISOString(),
      },
    ],
    isLoading: false,
  },
}

export const FewInsights: Story = {
  args: {
    data: createMockInsights(2),
    isLoading: false,
  },
}

export const Empty: Story = {
  args: {
    data: EMPTY_INSIGHTS,
    isLoading: false,
  },
}

export const Loading: Story = {
  args: {
    data: undefined,
    isLoading: true,
  },
}

export const ErrorState: Story = {
  args: {
    data: undefined,
    isLoading: false,
    error: new globalThis.Error('Failed to load insights'),
  },
}

export const WithViewAllButton: Story = {
  args: {
    data: createMockInsights(5),
    isLoading: false,
    onViewAll: () => alert('View all insights clicked'),
  },
}
