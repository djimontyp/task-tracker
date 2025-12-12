import type { Meta, StoryObj } from '@storybook/react-vite';
import AtomCard from './AtomCard';
import { AtomType, type Atom } from '../types';

/**
 * AtomCard component displays knowledge atoms with type badges, confidence scores,
 * approval status, and pending version notifications.
 *
 * ## Design System Rules
 * - Semantic colors: `bg-semantic-error` (problem), `bg-semantic-success` (solution)
 * - 4px grid spacing: `p-4`, `gap-2`, `gap-4`
 * - Status indicators: Icon + text (approved badge with checkmark)
 * - Responsive: Mobile-first with line clamping
 * - Interactive: Hover effects, WebSocket real-time updates
 */
const meta: Meta<typeof AtomCard> = {
  title: 'Features/Atoms/AtomCard',
  component: AtomCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Knowledge atom card with real-time version tracking via WebSocket. Supports 7 atom types with semantic color coding.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AtomCard>;

const baseAtom: Atom = {
  id: 1,
  title: 'Database connection pooling issue',
  content:
    'Connection pool exhaustion occurs under high load, causing timeouts. Need to investigate pool configuration.',
  type: AtomType.Problem,
  confidence: 0.87,
  user_approved: false,
  archived: false,
  archived_at: null,
  meta: null,
  created_at: '2025-12-04T10:00:00Z',
  updated_at: '2025-12-04T10:00:00Z',
};

export const Problem: Story = {
  args: {
    atom: baseAtom,
  },
  parameters: {
    docs: {
      description: {
        story: 'Problem atom with error semantic color (`bg-semantic-error`)',
      },
    },
  },
};

export const Solution: Story = {
  args: {
    atom: {
      ...baseAtom,
      id: 2,
      type: AtomType.Solution,
      title: 'Increase connection pool size',
      content:
        'Increase max_connections from 100 to 200 and set pool_recycle to 3600 seconds to prevent stale connections.',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Solution atom with success semantic color (`bg-semantic-success`)',
      },
    },
  },
};

export const Decision: Story = {
  args: {
    atom: {
      ...baseAtom,
      id: 3,
      type: AtomType.Decision,
      title: 'Use PostgreSQL for message storage',
      content: 'After evaluating MongoDB and PostgreSQL, we chose PostgreSQL for ACID guarantees and pgvector support.',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Decision atom with info semantic color (`bg-semantic-info`)',
      },
    },
  },
};

export const Question: Story = {
  args: {
    atom: {
      ...baseAtom,
      id: 4,
      type: AtomType.Question,
      title: 'Should we implement rate limiting?',
      content: 'Do we need to add rate limiting for the API, or is the current load acceptable for now?',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Question atom with warning semantic color (`bg-semantic-warning`)',
      },
    },
  },
};

export const Insight: Story = {
  args: {
    atom: {
      ...baseAtom,
      id: 5,
      type: AtomType.Insight,
      title: 'Users prefer Telegram over email',
      content: '80% of user notifications are read via Telegram within 5 minutes, vs 2 hours for email.',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Insight atom with accent color (`bg-accent`)',
      },
    },
  },
};

export const Pattern: Story = {
  args: {
    atom: {
      ...baseAtom,
      id: 6,
      type: AtomType.Pattern,
      title: 'Repository pattern for data access',
      content: 'All services use repository classes to abstract database operations, making testing easier.',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Pattern atom with accent color (`bg-accent`)',
      },
    },
  },
};

export const Requirement: Story = {
  args: {
    atom: {
      ...baseAtom,
      id: 7,
      type: AtomType.Requirement,
      title: 'GDPR compliance for user data',
      content: 'All user data must be encrypted at rest and support right-to-erasure requests.',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Requirement atom with info semantic color (`bg-semantic-info`)',
      },
    },
  },
};

export const Approved: Story = {
  args: {
    atom: {
      ...baseAtom,
      user_approved: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Approved atom showing green checkmark badge with "Approved" text',
      },
    },
  },
};

export const LowConfidence: Story = {
  args: {
    atom: {
      ...baseAtom,
      confidence: 0.42,
      title: 'Possible memory leak in worker process',
      content: 'Memory usage increases over time, but not confirmed if it is a leak or expected behavior.',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Atom with low confidence score (42%)',
      },
    },
  },
};

export const LongContent: Story = {
  args: {
    atom: {
      ...baseAtom,
      title: 'Implementing a comprehensive authentication and authorization system with OAuth 2.0',
      content:
        'We need to implement a full authentication and authorization system that supports OAuth 2.0, JWT tokens, refresh token rotation, role-based access control (RBAC), and multi-factor authentication (MFA). The system should integrate with existing LDAP directories and support single sign-on (SSO) via SAML 2.0. This is a critical security requirement that must be completed before the production launch.',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Atom with long title and content demonstrating line-clamp-2 and line-clamp-3',
      },
    },
  },
};

export const Interactive: Story = {
  args: {
    atom: baseAtom,
    onClick: () => alert('Atom clicked! In real app, this opens detail view.'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Clickable atom card with hover effects and cursor-pointer',
      },
    },
  },
};

export const WithPendingVersions: Story = {
  args: {
    atom: baseAtom,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Atom with pending version badge (requires WebSocket connection to backend). Shows "X pending versions" badge with "View History" button.',
      },
    },
  },
};
