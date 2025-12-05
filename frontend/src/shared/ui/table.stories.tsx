import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import { Badge } from './badge';

/**
 * Table component for displaying tabular data.
 *
 * ## Design System Rules
 * - Use semantic colors for status indicators (not raw colors)
 * - Tables must be responsive (horizontal scroll on mobile)
 * - Header cells use `text-muted-foreground` for hierarchy
 * - Row hover states for better UX
 */
const meta: Meta<typeof Table> = {
  title: 'UI/Table',
  component: Table,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Accessible table component with semantic HTML and responsive design.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Table>;

// Sample data
const invoices = [
  { id: 'INV001', status: 'Paid', method: 'Credit Card', amount: '$250.00' },
  { id: 'INV002', status: 'Pending', method: 'PayPal', amount: '$150.00' },
  { id: 'INV003', status: 'Failed', method: 'Bank Transfer', amount: '$350.00' },
  { id: 'INV004', status: 'Paid', method: 'Credit Card', amount: '$450.00' },
];

const tasks = [
  { id: 1, title: 'Fix authentication bug', status: 'done', priority: 'high' },
  { id: 2, title: 'Update documentation', status: 'in-progress', priority: 'medium' },
  { id: 3, title: 'Review pull requests', status: 'todo', priority: 'low' },
  { id: 4, title: 'Deploy to staging', status: 'in-progress', priority: 'high' },
];

export const Basic: Story = {
  render: () => (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.id}</TableCell>
            <TableCell>{invoice.status}</TableCell>
            <TableCell>{invoice.method}</TableCell>
            <TableCell className="text-right">{invoice.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const WithStatusBadges: Story = {
  render: () => (
    <Table>
      <TableCaption>Tasks with semantic status indicators</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Task</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell className="font-mono text-sm">{task.id}</TableCell>
            <TableCell>{task.title}</TableCell>
            <TableCell>
              {task.status === 'done' && <Badge variant="success">Done</Badge>}
              {task.status === 'in-progress' && (
                <Badge variant="default">In Progress</Badge>
              )}
              {task.status === 'todo' && (
                <Badge variant="secondary">To Do</Badge>
              )}
            </TableCell>
            <TableCell>
              {task.priority === 'high' && (
                <Badge variant="destructive">High</Badge>
              )}
              {task.priority === 'medium' && (
                <Badge variant="warning">Medium</Badge>
              )}
              {task.priority === 'low' && (
                <Badge variant="secondary">Low</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Table with semantic Badge components for status and priority. Uses design system tokens.',
      },
    },
  },
};

export const WithIcons: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">INV001</TableCell>
          <TableCell>
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-status-connected" />
              <span>Paid</span>
            </span>
          </TableCell>
          <TableCell className="text-right">$250.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">INV002</TableCell>
          <TableCell>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-status-validating" />
              <span>Pending</span>
            </span>
          </TableCell>
          <TableCell className="text-right">$150.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">INV003</TableCell>
          <TableCell>
            <span className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-status-error" />
              <span>Failed</span>
            </span>
          </TableCell>
          <TableCell className="text-right">$350.00</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Status indicators with icon + text for accessibility (not just color).',
      },
    },
  },
};

export const WithFooter: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.id}</TableCell>
            <TableCell>{invoice.status}</TableCell>
            <TableCell>{invoice.method}</TableCell>
            <TableCell className="text-right">{invoice.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right font-semibold">$1,200.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};

export const Striped: Story = {
  render: () => (
    <Table>
      <TableCaption>Striped rows for easier scanning</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[
          { name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin' },
          { name: 'Bob Smith', email: 'bob@example.com', role: 'User' },
          { name: 'Carol White', email: 'carol@example.com', role: 'Editor' },
          { name: 'David Brown', email: 'david@example.com', role: 'User' },
        ].map((user, idx) => (
          <TableRow key={user.email} className={idx % 2 === 0 ? 'bg-muted/50' : ''}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.role}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const Empty: Story = {
  render: () => (
    <Table>
      <TableCaption>No data available</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
            No results found.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Empty state with centered message using muted text color.',
      },
    },
  },
};
