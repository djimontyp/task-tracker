import type { Meta, StoryObj } from '@storybook/react-vite';
import { PageWrapper, type PageVariant } from './PageWrapper';
import { Stack } from './Stack';

const meta: Meta<typeof PageWrapper> = {
  title: 'Layout/PageWrapper',
  component: PageWrapper,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
PageWrapper is the page-level layout primitive that provides consistent spacing,
width constraints, and responsive behavior across all pages.

**Variants:**
- \`fullWidth\`: Dashboard, Messages - full width with vertical spacing
- \`centered\`: Settings, Forms - centered with max-width constraint (768px)
- \`wide\`: Detail pages - wider max-width (1024px)
- \`narrow\`: Onboarding, Wizards - tight max-width (672px)
- \`search\`: Search page - centered with generous padding

**ESLint enforcement:**
The \`no-raw-page-wrapper\` rule warns when using raw container classes.
Use PageWrapper instead of \`className="container"\` or \`className="mx-auto max-w-*"\`.
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['fullWidth', 'centered', 'wide', 'narrow', 'search'] as PageVariant[],
      description: 'Page layout variant',
    },
    as: {
      control: 'select',
      options: ['div', 'main', 'section', 'article'],
      description: 'HTML element to render',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PageWrapper>;

const DemoCard = ({ title }: { title: string }) => (
  <div className="border rounded-lg p-6 bg-card">
    <h3 className="font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm">
      This is a demo card to show the layout constraints.
    </p>
  </div>
);

export const FullWidth: Story = {
  args: {
    variant: 'fullWidth',
    children: (
      <Stack gap="lg">
        <header>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Full width layout for dashboards and lists</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <DemoCard title="Card 1" />
          <DemoCard title="Card 2" />
          <DemoCard title="Card 3" />
        </div>
      </Stack>
    ),
  },
};

export const Centered: Story = {
  args: {
    variant: 'centered',
    children: (
      <Stack gap="lg">
        <header>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Centered layout with max-width 768px</p>
        </header>
        <DemoCard title="Settings Form" />
        <DemoCard title="Another Section" />
      </Stack>
    ),
  },
};

export const Wide: Story = {
  args: {
    variant: 'wide',
    children: (
      <Stack gap="lg">
        <header>
          <h1 className="text-3xl font-bold">Topic Details</h1>
          <p className="text-muted-foreground">Wide layout with max-width 1024px</p>
        </header>
        <DemoCard title="Main Content" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DemoCard title="Related Item 1" />
          <DemoCard title="Related Item 2" />
        </div>
      </Stack>
    ),
  },
};

export const Narrow: Story = {
  args: {
    variant: 'narrow',
    children: (
      <Stack gap="lg">
        <header className="text-center">
          <h1 className="text-3xl font-bold">Welcome</h1>
          <p className="text-muted-foreground">Narrow layout with max-width 672px for focused flows</p>
        </header>
        <DemoCard title="Onboarding Step 1" />
        <div className="flex justify-center">
          <button className="bg-primary text-primary-foreground px-6 py-2 rounded-md">
            Continue
          </button>
        </div>
      </Stack>
    ),
  },
};

export const Search: Story = {
  args: {
    variant: 'search',
    children: (
      <Stack gap="lg">
        <header>
          <h1 className="text-3xl font-bold">Search Results</h1>
          <p className="text-muted-foreground">Search layout with generous padding</p>
        </header>
        <div className="space-y-4">
          <DemoCard title="Result 1" />
          <DemoCard title="Result 2" />
          <DemoCard title="Result 3" />
        </div>
      </Stack>
    ),
  },
};

export const VariantComparison: Story = {
  render: () => (
    <div className="space-y-12 bg-muted p-4">
      {(['fullWidth', 'centered', 'wide', 'narrow'] as PageVariant[]).map((variant) => (
        <div key={variant}>
          <p className="text-sm font-medium mb-2 px-4">variant=&quot;{variant}&quot;</p>
          <div className="bg-background border rounded-lg overflow-hidden">
            <PageWrapper variant={variant}>
              <div className="h-20 bg-primary/10 border border-dashed rounded-md flex items-center justify-center">
                Content area
              </div>
            </PageWrapper>
          </div>
        </div>
      ))}
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};

export const SemanticElement: Story = {
  args: {
    variant: 'centered',
    as: 'main',
    children: (
      <Stack gap="lg">
        <header>
          <h1 className="text-3xl font-bold">Main Content</h1>
          <p className="text-muted-foreground">Using &lt;main&gt; element for accessibility</p>
        </header>
        <DemoCard title="Content here" />
      </Stack>
    ),
  },
};
