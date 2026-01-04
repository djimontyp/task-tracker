import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataList, InlineDataList, KeyValueGrid, StatGrid } from './DataList';
import { TooltipProvider } from '@/shared/ui/tooltip';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Calendar, Clock, Activity, Database, Cpu, HardDrive, Zap, Users, MessageSquare, CheckCircle } from 'lucide-react';

const meta: Meta<typeof DataList> = {
  title: 'Design System/Patterns/DataList',
  component: DataList,
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="max-w-2xl">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Semantic key-value pair display using proper HTML dl/dt/dd elements. Supports multiple columns, density variants, and icons.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DataList>;

// ===================================================================
// BASIC EXAMPLES
// ===================================================================

export const Default: Story = {
  args: {
    items: [
      { label: 'Model', value: 'gpt-4o' },
      { label: 'Temperature', value: '0.7' },
      { label: 'Max Tokens', value: '4096' },
      { label: 'Provider', value: 'OpenAI' },
    ],
  },
};

export const TwoColumns: Story = {
  args: {
    columns: 2,
    items: [
      { label: 'Model', value: 'gpt-4o' },
      { label: 'Temperature', value: '0.7' },
      { label: 'Max Tokens', value: '4096' },
      { label: 'Provider', value: 'OpenAI' },
      { label: 'Status', value: 'Active' },
      { label: 'Last Used', value: '2 hours ago' },
    ],
  },
};

export const ThreeColumns: Story = {
  args: {
    columns: 3,
    items: [
      { label: 'Total Messages', value: '1,234' },
      { label: 'Processed', value: '1,180' },
      { label: 'Pending', value: '54' },
      { label: 'Success Rate', value: '95.6%' },
      { label: 'Avg Time', value: '1.2s' },
      { label: 'Errors', value: '12' },
    ],
  },
};

// ===================================================================
// DENSITY VARIANTS
// ===================================================================

export const CompactDensity: Story = {
  args: {
    density: 'compact',
    columns: 2,
    items: [
      { label: 'Model', value: 'gpt-4o' },
      { label: 'Temperature', value: '0.7' },
      { label: 'Max Tokens', value: '4096' },
      { label: 'Provider', value: 'OpenAI' },
    ],
  },
};

export const SpaciousDensity: Story = {
  args: {
    density: 'spacious',
    items: [
      { label: 'Model', value: 'gpt-4o' },
      { label: 'Temperature', value: '0.7' },
      { label: 'Max Tokens', value: '4096' },
    ],
  },
};

// ===================================================================
// WITH ICONS
// ===================================================================

export const WithIcons: Story = {
  args: {
    columns: 2,
    items: [
      { label: 'Database', value: 'PostgreSQL 15', icon: <Database className="h-4 w-4" /> },
      { label: 'CPU Usage', value: '45%', icon: <Cpu className="h-4 w-4" /> },
      { label: 'Memory', value: '8.2 GB', icon: <HardDrive className="h-4 w-4" /> },
      { label: 'Uptime', value: '99.9%', icon: <Activity className="h-4 w-4" /> },
    ],
  },
};

// ===================================================================
// HORIZONTAL ORIENTATION
// ===================================================================

export const HorizontalOrientation: Story = {
  args: {
    orientation: 'horizontal',
    divided: true,
    items: [
      { label: 'Created', value: 'Jan 15, 2024', icon: <Calendar className="h-4 w-4" /> },
      { label: 'Last Modified', value: '2 hours ago', icon: <Clock className="h-4 w-4" /> },
      { label: 'Status', value: <Badge variant="outline">Active</Badge>, icon: <Activity className="h-4 w-4" /> },
    ],
  },
};

// ===================================================================
// WITH DIVIDERS
// ===================================================================

export const WithDividers: Story = {
  args: {
    divided: true,
    items: [
      { label: 'Model', value: 'gpt-4o' },
      { label: 'Temperature', value: '0.7' },
      { label: 'Max Tokens', value: '4096' },
      { label: 'Provider', value: 'OpenAI' },
    ],
  },
};

// ===================================================================
// VARIANT STYLES
// ===================================================================

export const MutedVariant: Story = {
  args: {
    variant: 'muted',
    columns: 2,
    items: [
      { label: 'Model', value: 'gpt-4o' },
      { label: 'Temperature', value: '0.7' },
      { label: 'Max Tokens', value: '4096' },
      { label: 'Provider', value: 'OpenAI' },
    ],
  },
};

export const CardVariant: Story = {
  args: {
    variant: 'card',
    columns: 2,
    items: [
      { label: 'Model', value: 'gpt-4o' },
      { label: 'Temperature', value: '0.7' },
      { label: 'Max Tokens', value: '4096' },
      { label: 'Provider', value: 'OpenAI' },
    ],
  },
};

// ===================================================================
// COMPLEX VALUES
// ===================================================================

export const WithComplexValues: Story = {
  args: {
    columns: 2,
    items: [
      {
        label: 'Status',
        value: (
          <Badge variant="outline" className="bg-semantic-success/10 text-semantic-success border-semantic-success">
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Connected
          </Badge>
        ),
      },
      {
        label: 'Performance',
        value: <Badge variant="secondary">High</Badge>,
      },
      {
        label: 'Model',
        value: <code className="text-xs bg-muted px-2 py-0.5 rounded">gpt-4o-2024-01-15</code>,
      },
      {
        label: 'API Key',
        value: <code className="text-xs bg-muted px-2 py-0.5 rounded">sk-...4f2a</code>,
      },
    ],
  },
};

// ===================================================================
// WITH DESCRIPTIONS
// ===================================================================

export const WithDescriptions: Story = {
  args: {
    items: [
      {
        label: 'Temperature',
        value: '0.7',
        description: 'Controls randomness in output generation',
      },
      {
        label: 'Max Tokens',
        value: '4096',
        description: 'Maximum number of tokens to generate',
      },
      {
        label: 'Top P',
        value: '0.9',
        description: 'Nucleus sampling threshold',
      },
    ],
  },
};

// ===================================================================
// COL SPAN
// ===================================================================

export const WithColSpan: Story = {
  args: {
    columns: 2,
    items: [
      { label: 'Model', value: 'gpt-4o' },
      { label: 'Temperature', value: '0.7' },
      {
        label: 'System Prompt',
        value: 'You are a helpful AI assistant specialized in knowledge extraction...',
        colSpan: 2,
        truncate: true,
      },
    ],
  },
};

// ===================================================================
// INLINE DATA LIST
// ===================================================================

export const InlineItem: StoryObj<typeof InlineDataList> = {
  render: () => (
    <Card className="max-w-sm">
      <CardContent className="pt-6 space-y-2">
        <InlineDataList label="Status" value={<Badge>Active</Badge>} icon={<Activity className="h-4 w-4" />} />
        <InlineDataList label="Last Run" value="2 hours ago" icon={<Clock className="h-4 w-4" />} />
        <InlineDataList label="Success Rate" value="98.5%" icon={<Zap className="h-4 w-4" />} />
      </CardContent>
    </Card>
  ),
};

// ===================================================================
// KEY VALUE GRID
// ===================================================================

export const SimpleKeyValueGrid: StoryObj<typeof KeyValueGrid> = {
  render: () => (
    <KeyValueGrid
      columns={2}
      data={{
        'Model': 'gpt-4o',
        'Temperature': 0.7,
        'Max Tokens': 4096,
        'Provider': 'OpenAI',
      }}
    />
  ),
};

// ===================================================================
// STAT GRID
// ===================================================================

export const StatsDisplay: StoryObj<typeof StatGrid> = {
  render: () => (
    <StatGrid
      columns={3}
      stats={[
        { label: 'Total Messages', value: '12,345' },
        { label: 'Processed', value: '11,890', description: '+234 today' },
        { label: 'Pending', value: '455' },
        { label: 'Active Users', value: '1,234' },
        { label: 'Topics', value: '89' },
        { label: 'Atoms', value: '2,341' },
      ]}
    />
  ),
};

// ===================================================================
// REAL-WORLD: AGENT CARD CONTENT
// ===================================================================

export const AgentCardContent: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">Knowledge Extraction</CardTitle>
      </CardHeader>
      <CardContent>
        <DataList
          density="compact"
          columns={2}
          items={[
            { label: 'Model', value: <code className="text-xs font-mono">gpt-4o</code> },
            { label: 'Temperature', value: '0.7' },
            { label: 'Max Tokens', value: '4096' },
            {
              label: 'Status',
              value: <Badge variant="outline">Active</Badge>,
            },
          ]}
        />
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">System Prompt</p>
          <p className="text-sm mt-1 line-clamp-2">
            You are an AI assistant specialized in extracting structured knowledge from conversations...
          </p>
        </div>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of DataList usage inside an AgentCard for displaying configuration.',
      },
    },
  },
};

// ===================================================================
// REAL-WORLD: DASHBOARD STATS
// ===================================================================

export const DashboardStats: StoryObj<typeof StatGrid> = {
  render: () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">12,345</p>
                <p className="text-sm text-muted-foreground">Total Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-semantic-success/10">
                <CheckCircle className="h-5 w-5 text-semantic-success" />
              </div>
              <div>
                <p className="text-2xl font-semibold">2,341</p>
                <p className="text-sm text-muted-foreground">Atoms Created</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-semantic-info/10">
                <Users className="h-5 w-5 text-semantic-info" />
              </div>
              <div>
                <p className="text-2xl font-semibold">89</p>
                <p className="text-sm text-muted-foreground">Active Topics</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  ),
};
