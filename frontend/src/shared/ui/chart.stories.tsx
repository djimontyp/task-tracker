import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from './chart';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const meta: Meta<typeof ChartContainer> = {
  title: 'UI/Chart',
  component: ChartContainer,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Chart container component wrapping Recharts. Provides theming, responsive sizing, and consistent styling.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ChartContainer>;

// Sample data
const barData = [
  { month: 'Jan', desktop: 186, mobile: 80 },
  { month: 'Feb', desktop: 305, mobile: 200 },
  { month: 'Mar', desktop: 237, mobile: 120 },
  { month: 'Apr', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'Jun', desktop: 214, mobile: 140 },
];

const lineData = [
  { date: 'Mon', value: 100 },
  { date: 'Tue', value: 120 },
  { date: 'Wed', value: 115 },
  { date: 'Thu', value: 140 },
  { date: 'Fri', value: 130 },
  { date: 'Sat', value: 90 },
  { date: 'Sun', value: 85 },
];

const chartConfig: ChartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'hsl(var(--chart-1))',
  },
  mobile: {
    label: 'Mobile',
    color: 'hsl(var(--chart-2))',
  },
};

const singleConfig: ChartConfig = {
  value: {
    label: 'Value',
    color: 'hsl(var(--primary))',
  },
};

export const BarChartExample: Story = {
  render: () => (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <BarChart data={barData} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Bar chart with two data series, tooltip, and legend.',
      },
    },
  },
};

export const LineChartExample: Story = {
  render: () => (
    <ChartContainer config={singleConfig} className="h-[300px] w-full">
      <LineChart data={lineData} accessibilityLayer>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--color-value)"
          strokeWidth={2}
          dot={{ fill: 'var(--color-value)' }}
        />
      </LineChart>
    </ChartContainer>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Line chart with single data series.',
      },
    },
  },
};

export const AreaChartExample: Story = {
  render: () => (
    <ChartContainer config={singleConfig} className="h-[300px] w-full">
      <AreaChart data={lineData} accessibilityLayer>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-value)"
          fill="var(--color-value)"
          fillOpacity={0.2}
        />
      </AreaChart>
    </ChartContainer>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Area chart with gradient fill.',
      },
    },
  },
};

export const SmallChart: Story = {
  render: () => (
    <ChartContainer config={singleConfig} className="h-[150px] w-[300px]">
      <LineChart data={lineData} accessibilityLayer>
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--color-value)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Compact sparkline-style chart without axes.',
      },
    },
  },
};

export const WithCustomConfig: Story = {
  render: () => {
    const customConfig: ChartConfig = {
      revenue: {
        label: 'Revenue',
        theme: {
          light: 'hsl(142.1 76.2% 36.3%)',
          dark: 'hsl(142.1 70.6% 45.3%)',
        },
      },
      expenses: {
        label: 'Expenses',
        theme: {
          light: 'hsl(0 84.2% 60.2%)',
          dark: 'hsl(0 72.2% 50.6%)',
        },
      },
    };

    const data = [
      { quarter: 'Q1', revenue: 45000, expenses: 32000 },
      { quarter: 'Q2', revenue: 52000, expenses: 38000 },
      { quarter: 'Q3', revenue: 61000, expenses: 42000 },
      { quarter: 'Q4', revenue: 58000, expenses: 45000 },
    ];

    return (
      <ChartContainer config={customConfig} className="h-[300px] w-full">
        <BarChart data={data} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="quarter" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Chart with custom theme colors for light/dark modes.',
      },
    },
  },
};
