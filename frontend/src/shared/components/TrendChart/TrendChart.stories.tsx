import type { Meta, StoryObj } from '@storybook/react-vite';
import { TrendChart } from './TrendChart';

const meta: Meta<typeof TrendChart> = {
  title: 'Patterns/TrendChart',
  component: TrendChart,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Area chart component for displaying time-series data with trends. Built with Recharts and supports customizable axes, grid, and data visualization.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TrendChart>;

// Sample data for stories
const sampleWeeklyData = [
  { date: '2025-11-28', messages: 45 },
  { date: '2025-11-29', messages: 52 },
  { date: '2025-11-30', messages: 38 },
  { date: '2025-12-01', messages: 61 },
  { date: '2025-12-02', messages: 55 },
  { date: '2025-12-03', messages: 48 },
  { date: '2025-12-04', messages: 72 },
];

const sampleMonthlyData = [
  { month: '2025-07', count: 234 },
  { month: '2025-08', count: 298 },
  { month: '2025-09', count: 275 },
  { month: '2025-10', count: 312 },
  { month: '2025-11', count: 289 },
  { month: '2025-12', count: 351 },
];

const sampleEmptyData: Array<{ date: string; value: number }> = [];

const chartConfig = {
  messages: {
    label: 'Messages',
    color: 'hsl(var(--primary))',
  },
  count: {
    label: 'Count',
    color: 'hsl(var(--primary))',
  },
  value: {
    label: 'Value',
    color: 'hsl(var(--primary))',
  },
};

export const Default: Story = {
  args: {
    title: 'Message Activity',
    data: sampleWeeklyData,
    dataKey: 'messages',
    xAxisKey: 'date',
    config: chartConfig,
    height: 300,
  },
};

export const WithoutTitle: Story = {
  args: {
    data: sampleWeeklyData,
    dataKey: 'messages',
    xAxisKey: 'date',
    config: chartConfig,
    height: 300,
  },
};

export const WithYAxis: Story = {
  args: {
    title: 'Messages with Y-Axis',
    data: sampleWeeklyData,
    dataKey: 'messages',
    xAxisKey: 'date',
    config: chartConfig,
    showYAxis: true,
    height: 300,
  },
};

export const WithoutGrid: Story = {
  args: {
    title: 'Clean Chart (No Grid)',
    data: sampleWeeklyData,
    dataKey: 'messages',
    xAxisKey: 'date',
    config: chartConfig,
    showGrid: false,
    height: 300,
  },
};

export const MonthlyData: Story = {
  args: {
    title: 'Monthly Analytics',
    data: sampleMonthlyData,
    dataKey: 'count',
    xAxisKey: 'month',
    config: chartConfig,
    showYAxis: true,
    height: 300,
  },
};

export const EmptyState: Story = {
  args: {
    title: 'No Data Available',
    data: sampleEmptyData,
    dataKey: 'value',
    xAxisKey: 'date',
    config: chartConfig,
    height: 300,
  },
};

export const TallChart: Story = {
  args: {
    title: 'Extended Height Chart',
    data: sampleWeeklyData,
    dataKey: 'messages',
    xAxisKey: 'date',
    config: chartConfig,
    height: 500,
  },
};

export const CompactChart: Story = {
  args: {
    title: 'Compact Chart',
    data: sampleWeeklyData,
    dataKey: 'messages',
    xAxisKey: 'date',
    config: chartConfig,
    height: 200,
  },
};
