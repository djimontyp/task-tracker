import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  HelpCircle,
  Target,
  Layers,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  semantic,
  status,
  atom,
  chart,
  brand,
  base,
  gap,
  padding,
  spacing,
  touchTarget,
  radius,
  margin,
  zIndex,
  zIndexClasses,
  badges,
  cards,
  buttons,
  loading,
  emptyState,
  forms,
  lists,
  avatars,
  focus,
  transitions,
  pageLayouts,
  statusIndicators,
  spacingMap,
} from './index';

/**
 * Design System Tokens Documentation
 *
 * This section documents all available design tokens for the Pulse Radar application.
 * These tokens provide type-safe, consistent styling utilities that should be used
 * instead of raw Tailwind classes.
 *
 * ## Key Benefits
 * - **Type Safety**: IDE autocomplete and compile-time checks
 * - **Consistency**: All components use the same design language
 * - **Maintainability**: Change tokens in one place, update everywhere
 * - **WCAG Compliance**: Tokens enforce accessibility patterns
 *
 * ## Usage
 * ```tsx
 * import { semantic, gap, badges } from '@/shared/tokens';
 *
 * <Badge className={badges.status.connected}>Connected</Badge>
 * <div className={gap.md}>Content with 16px gap</div>
 * ```
 */
const meta: Meta = {
  title: 'Design System/Tokens',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

// ═══════════════════════════════════════════════════════════════════════════
// COLOR TOKENS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Semantic colors for general purpose use cases.
 * Use these for feedback states, alerts, and notifications.
 */
export const SemanticColors: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Semantic Colors</h3>
        <p className="text-sm text-muted-foreground mb-4">
          General purpose colors for feedback states. Import: <code>import {'{ semantic }'} from '@/shared/tokens';</code>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Success */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-semantic-success" />
              Success
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className={`${semantic.success.bg} p-4 rounded text-white text-sm`}>
              bg-semantic-success
            </div>
            <div className={`${semantic.success.text} text-sm font-medium`}>
              text-semantic-success
            </div>
            <div className={`${semantic.success.border} border-2 p-2 rounded text-sm`}>
              border-semantic-success
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Use for: confirmations, successful operations, positive feedback
            </p>
          </CardContent>
        </Card>

        {/* Warning */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-semantic-warning" />
              Warning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className={`${semantic.warning.bg} p-4 rounded text-white text-sm`}>
              bg-semantic-warning
            </div>
            <div className={`${semantic.warning.text} text-sm font-medium`}>
              text-semantic-warning
            </div>
            <div className={`${semantic.warning.border} border-2 p-2 rounded text-sm`}>
              border-semantic-warning
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Use for: cautions, pending states, attention needed
            </p>
          </CardContent>
        </Card>

        {/* Error */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <XCircle className="h-4 w-4 text-semantic-error" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className={`${semantic.error.bg} p-4 rounded text-white text-sm`}>
              bg-semantic-error
            </div>
            <div className={`${semantic.error.text} text-sm font-medium`}>
              text-semantic-error
            </div>
            <div className={`${semantic.error.border} border-2 p-2 rounded text-sm`}>
              border-semantic-error
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Use for: errors, failures, destructive actions
            </p>
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="h-4 w-4 text-semantic-info" />
              Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className={`${semantic.info.bg} p-4 rounded text-white text-sm`}>
              bg-semantic-info
            </div>
            <div className={`${semantic.info.text} text-sm font-medium`}>
              text-semantic-info
            </div>
            <div className={`${semantic.info.border} border-2 p-2 rounded text-sm`}>
              border-semantic-info
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Use for: informational messages, tips, neutral states
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Semantic colors provide consistent feedback states. Each color includes bg, text, border, and ring variants.',
      },
    },
  },
};

/**
 * Status colors for connection and validation states.
 * Use these for service health indicators and real-time status.
 */
export const StatusColors: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Status Colors</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Connection and validation state colors. Import: <code>import {'{ status }'} from '@/shared/tokens';</code>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Connected */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-status-connected" />
              Connected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className={`${status.connected.bg} p-4 rounded text-white text-sm`}>
              bg-status-connected
            </div>
            <Badge variant="outline" className={badges.status.connected}>
              <CheckCircle className="h-3.5 w-3.5" />
              Connected
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Use for: active connections, online services, successful validations
            </p>
          </CardContent>
        </Card>

        {/* Validating */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-status-validating" />
              Validating
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className={`${status.validating.bg} p-4 rounded text-white text-sm`}>
              bg-status-validating
            </div>
            <Badge variant="outline" className={badges.status.validating}>
              <Clock className="h-3.5 w-3.5" />
              Validating
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Use for: in-progress validations, loading states, processing
            </p>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-status-pending" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className={`${status.pending.bg} p-4 rounded text-white text-sm`}>
              bg-status-pending
            </div>
            <Badge variant="outline" className={badges.status.pending}>
              <AlertCircle className="h-3.5 w-3.5" />
              Pending
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Use for: awaiting action, not yet started, queued items
            </p>
          </CardContent>
        </Card>

        {/* Error */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <XCircle className="h-4 w-4 text-status-error" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className={`${status.error.bg} p-4 rounded text-white text-sm`}>
              bg-status-error
            </div>
            <Badge variant="outline" className={badges.status.error}>
              <XCircle className="h-3.5 w-3.5" />
              Error
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Use for: failed connections, offline services, validation errors
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Status colors indicate connection and validation states. Always use with icon + text for WCAG compliance.',
      },
    },
  },
};

/**
 * Atom type colors for knowledge categorization.
 * Each atom type has its own distinct color for easy visual identification.
 */
export const AtomTypeColors: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Atom Type Colors</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Knowledge atom categorization colors. Import: <code>import {'{ atom }'} from '@/shared/tokens';</code>
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Problem */}
        <div className="space-y-2">
          <Badge variant="outline" className={badges.atom.problem}>
            <AlertCircle className="h-3.5 w-3.5" />
            Problem
          </Badge>
          <p className="text-xs text-muted-foreground">Issues to solve</p>
        </div>

        {/* Solution */}
        <div className="space-y-2">
          <Badge variant="outline" className={badges.atom.solution}>
            <CheckCircle className="h-3.5 w-3.5" />
            Solution
          </Badge>
          <p className="text-xs text-muted-foreground">Answers & fixes</p>
        </div>

        {/* Decision */}
        <div className="space-y-2">
          <Badge variant="outline" className={badges.atom.decision}>
            <Target className="h-3.5 w-3.5" />
            Decision
          </Badge>
          <p className="text-xs text-muted-foreground">Choices made</p>
        </div>

        {/* Question */}
        <div className="space-y-2">
          <Badge variant="outline" className={badges.atom.question}>
            <HelpCircle className="h-3.5 w-3.5" />
            Question
          </Badge>
          <p className="text-xs text-muted-foreground">Open inquiries</p>
        </div>

        {/* Insight */}
        <div className="space-y-2">
          <Badge variant="outline" className={badges.atom.insight}>
            <Lightbulb className="h-3.5 w-3.5" />
            Insight
          </Badge>
          <p className="text-xs text-muted-foreground">Key observations</p>
        </div>

        {/* Pattern */}
        <div className="space-y-2">
          <Badge variant="outline" className={badges.atom.pattern}>
            <Layers className="h-3.5 w-3.5" />
            Pattern
          </Badge>
          <p className="text-xs text-muted-foreground">Recurring themes</p>
        </div>

        {/* Requirement */}
        <div className="space-y-2">
          <Badge variant="outline" className={badges.atom.requirement}>
            <FileText className="h-3.5 w-3.5" />
            Requirement
          </Badge>
          <p className="text-xs text-muted-foreground">Specifications</p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h4 className="font-medium mb-2">Token Structure</h4>
        <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`atom.problem.bg     // 'bg-atom-problem'
atom.problem.text   // 'text-atom-problem'
atom.problem.border // 'border-atom-problem'`}
        </pre>
      </div>

      {/* Direct atom token usage examples */}
      <div className="mt-6">
        <h4 className="font-medium mb-4">Direct Color Token Usage</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`${atom.insight.bg} p-4 rounded text-white text-sm`}>
            atom.insight.bg
          </div>
          <div className={`border-2 ${atom.decision.border} p-4 rounded text-sm`}>
            atom.decision.border
          </div>
          <div className={`${atom.question.text} font-medium`}>
            atom.question.text
          </div>
          <div className={`${atom.pattern.bg} p-4 rounded text-white text-sm`}>
            atom.pattern.bg
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Atom types represent different categories of knowledge extracted from messages. Each type has bg, text, and border variants.',
      },
    },
  },
};

/**
 * Chart colors for data visualization.
 * Use these for signal/noise classification and other data displays.
 */
export const ChartColors: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Chart Colors</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Data visualization colors. Import: <code>import {'{ chart }'} from '@/shared/tokens';</code>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Signal */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-chart-signal" />
              Signal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className={`${chart.signal.bg} p-4 rounded text-white text-sm`}>
              bg-chart-signal
            </div>
            <p className="text-xs text-muted-foreground">
              Important, actionable messages
            </p>
          </CardContent>
        </Card>

        {/* Weak Signal */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Minus className="h-4 w-4 text-chart-weak-signal" />
              Weak Signal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className={`${chart.weakSignal.bg} p-4 rounded text-white text-sm`}>
              bg-chart-weak-signal
            </div>
            <p className="text-xs text-muted-foreground">
              Potentially relevant messages
            </p>
          </CardContent>
        </Card>

        {/* Noise */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-chart-noise" />
              Noise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className={`${chart.noise.bg} p-4 rounded text-white text-sm`}>
              bg-chart-noise
            </div>
            <p className="text-xs text-muted-foreground">
              Low-value, filtered messages
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  ),
};

/**
 * Brand colors for external service integrations.
 */
export const BrandColors: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Brand Colors</h3>
        <p className="text-sm text-muted-foreground mb-4">
          External service brand colors. Import: <code>import {'{ brand }'} from '@/shared/tokens';</code>
        </p>
      </div>

      <div className="flex gap-4">
        <Card className="w-64">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Telegram</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className={`${brand.telegram.bg} p-4 rounded text-white text-sm`}>
              bg-brand-telegram
            </div>
            <div className={`${brand.telegram.text} text-sm font-medium`}>
              text-brand-telegram
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════
// SPACING TOKENS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gap scale for flexbox and grid layouts.
 * All values follow the 4px grid system.
 */
export const GapScale: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Gap Scale (4px Grid)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Flexbox/Grid spacing. Import: <code>import {'{ gap }'} from '@/shared/tokens';</code>
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(gap).map(([key, value]) => (
          <div key={key} className="flex items-center gap-4">
            <div className="w-20 text-sm font-mono">{key}</div>
            <div className="w-24 text-xs text-muted-foreground">{value}</div>
            <div className={`flex ${value} bg-muted/50 p-2 rounded`}>
              <div className="h-8 w-8 bg-primary rounded"></div>
              <div className="h-8 w-8 bg-primary rounded"></div>
              <div className="h-8 w-8 bg-primary rounded"></div>
            </div>
            <div className="text-xs text-muted-foreground">
              {key === 'none' && '0px'}
              {key === 'xs' && '4px'}
              {key === 'sm' && '8px'}
              {key === 'md' && '16px'}
              {key === 'lg' && '24px'}
              {key === 'xl' && '32px'}
              {key === '2xl' && '40px'}
              {key === '3xl' && '48px'}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h4 className="font-medium mb-2">Usage Example</h4>
        <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`import { gap } from '@/shared/tokens';

<div className={\`flex \${gap.md}\`}>
  <Card />
  <Card />
</div>`}
        </pre>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Gap tokens ensure consistent spacing in flex and grid layouts. All values are multiples of 4px.',
      },
    },
  },
};

/**
 * Padding presets for common component patterns.
 */
export const PaddingPatterns: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Padding Patterns</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Component internal spacing. Import: <code>import {'{ padding }'} from '@/shared/tokens';</code>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Padding */}
        <div className="space-y-4">
          <h4 className="font-medium">Card Padding</h4>
          <div className={`${padding.card.sm} bg-muted border rounded`}>
            <div className="bg-background rounded text-sm">p-4 (sm)</div>
          </div>
          <div className={`${padding.card.default} bg-muted border rounded`}>
            <div className="bg-background rounded text-sm">p-6 (default)</div>
          </div>
          <div className={`${padding.card.lg} bg-muted border rounded`}>
            <div className="bg-background rounded text-sm">p-8 (lg)</div>
          </div>
        </div>

        {/* Button Padding */}
        <div className="space-y-4">
          <h4 className="font-medium">Button Padding</h4>
          <Button className={padding.button.sm}>Small</Button>
          <Button className={padding.button.md}>Medium</Button>
          <Button className={padding.button.lg}>Large</Button>
        </div>

        {/* Input Padding */}
        <div className="space-y-4">
          <h4 className="font-medium">Input Padding</h4>
          <input
            type="text"
            placeholder="Default (px-4 py-2)"
            className={`${padding.input.default} border rounded w-full`}
          />
          <input
            type="text"
            placeholder="Small (px-2 py-1)"
            className={`${padding.input.sm} border rounded w-full`}
          />
        </div>
      </div>
    </div>
  ),
};

/**
 * Touch target sizes for WCAG 2.5.5 compliance.
 * Minimum 44px for interactive elements.
 */
export const TouchTargets: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Touch Targets (WCAG 2.5.5)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Minimum interactive element sizes. Import: <code>import {'{ touchTarget }'} from '@/shared/tokens';</code>
        </p>
      </div>

      <div className="flex items-end gap-8">
        <div className="text-center">
          <Button variant="outline" className={touchTarget.min} aria-label="Minimum size">
            <CheckCircle className="h-5 w-5" />
          </Button>
          <p className="text-xs mt-2">min (44px)</p>
          <p className="text-xs text-muted-foreground">WCAG AA minimum</p>
        </div>

        <div className="text-center">
          <Button variant="outline" className={touchTarget.comfortable} aria-label="Comfortable size">
            <CheckCircle className="h-5 w-5" />
          </Button>
          <p className="text-xs mt-2">comfortable (48px)</p>
          <p className="text-xs text-muted-foreground">Recommended</p>
        </div>

        <div className="text-center">
          <Button variant="outline" className={touchTarget.large} aria-label="Large size">
            <CheckCircle className="h-6 w-6" />
          </Button>
          <p className="text-xs mt-2">large (56px)</p>
          <p className="text-xs text-muted-foreground">Primary actions</p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-semantic-warning/10 border border-semantic-warning rounded-lg">
        <h4 className="font-medium text-semantic-warning mb-2">Important</h4>
        <p className="text-sm">
          All icon buttons MUST be at least 44px for WCAG compliance.
          Always include <code>aria-label</code> for accessibility.
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Touch targets ensure interactive elements are large enough for users with motor impairments. Minimum 44px per WCAG 2.5.5.',
      },
    },
  },
};

/**
 * Border radius scale for consistent rounding.
 */
export const BorderRadius: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Border Radius</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Consistent rounding. Import: <code>import {'{ radius }'} from '@/shared/tokens';</code>
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        {Object.entries(radius).map(([key, value]) => (
          <div key={key} className="text-center">
            <div className={`h-16 w-16 bg-primary ${value}`}></div>
            <p className="text-xs mt-2 font-mono">{key}</p>
            <p className="text-xs text-muted-foreground">{value}</p>
          </div>
        ))}
      </div>
    </div>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════
// Z-INDEX TOKENS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Z-index layer hierarchy for consistent stacking.
 */
export const ZIndexLayers: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Z-Index Layers</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Stacking order hierarchy. Import: <code>import {'{ zIndex, zIndexClasses }'} from '@/shared/tokens';</code>
        </p>
      </div>

      <div className="relative h-80 bg-muted/20 rounded-lg overflow-hidden">
        {/* Visual stack representation */}
        {Object.entries(zIndex).map(([key, value], index) => {
          const offset = index * 28;
          return (
            <div
              key={key}
              className="absolute left-4 right-4 h-10 bg-card border shadow-sm rounded flex items-center justify-between px-4"
              style={{
                top: `${offset + 8}px`,
                zIndex: value,
              }}
            >
              <span className="text-sm font-medium">{key}</span>
              <span className="text-xs text-muted-foreground">z-index: {value}</span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Numeric Values</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`import { zIndex } from '@/shared/tokens';

// For inline styles
style={{ zIndex: zIndex.modal }}  // 50
style={{ zIndex: zIndex.tooltip }} // 70`}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tailwind Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`import { zIndexClasses } from '@/shared/tokens';

// For className
className={zIndexClasses.modal}   // 'z-modal'
className={zIndexClasses.tooltip} // 'z-tooltip'`}
            </pre>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Layer Hierarchy Guide</h4>
        <table className="w-full text-sm">
          <thead className="text-left">
            <tr className="border-b">
              <th className="py-2">Layer</th>
              <th className="py-2">Value</th>
              <th className="py-2">When to Use</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2 font-mono">base</td>
              <td className="py-2">0</td>
              <td className="py-2 text-muted-foreground">Default content</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono">dropdown</td>
              <td className="py-2">10</td>
              <td className="py-2 text-muted-foreground">Dropdowns, selects, autocomplete</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono">sticky</td>
              <td className="py-2">20</td>
              <td className="py-2 text-muted-foreground">Sticky headers, FABs</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono">fixed</td>
              <td className="py-2">30</td>
              <td className="py-2 text-muted-foreground">Fixed navigation, sidebars</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono">modalBackdrop</td>
              <td className="py-2">40</td>
              <td className="py-2 text-muted-foreground">Modal/dialog overlay</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono">modal</td>
              <td className="py-2">50</td>
              <td className="py-2 text-muted-foreground">Modals, dialogs, sheets</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono">popover</td>
              <td className="py-2">60</td>
              <td className="py-2 text-muted-foreground">Popovers, context menus</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono">tooltip</td>
              <td className="py-2">70</td>
              <td className="py-2 text-muted-foreground">Tooltips (above interactive)</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-mono">toast</td>
              <td className="py-2">80</td>
              <td className="py-2 text-muted-foreground">Toast notifications</td>
            </tr>
            <tr>
              <td className="py-2 font-mono text-semantic-warning">max</td>
              <td className="py-2">9999</td>
              <td className="py-2 text-muted-foreground">Emergency override only!</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Z-index tokens provide a consistent layering system. Use the appropriate layer for each UI element type.',
      },
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// PATTERN TOKENS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pre-built badge patterns for status and atom types.
 */
export const BadgePatterns: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Badge Patterns</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Ready-to-use badge combinations. Import: <code>import {'{ badges }'} from '@/shared/tokens';</code>
        </p>
      </div>

      <div className="space-y-6">
        {/* Status Badges */}
        <div>
          <h4 className="font-medium mb-4">Status Badges</h4>
          <div className="flex flex-wrap gap-4">
            <Badge variant="outline" className={badges.status.connected}>
              <CheckCircle className="h-3.5 w-3.5" />
              Connected
            </Badge>
            <Badge variant="outline" className={badges.status.validating}>
              <Clock className="h-3.5 w-3.5" />
              Validating
            </Badge>
            <Badge variant="outline" className={badges.status.pending}>
              <AlertCircle className="h-3.5 w-3.5" />
              Pending
            </Badge>
            <Badge variant="outline" className={badges.status.error}>
              <XCircle className="h-3.5 w-3.5" />
              Error
            </Badge>
          </div>
        </div>

        {/* Semantic Badges */}
        <div>
          <h4 className="font-medium mb-4">Semantic Badges</h4>
          <div className="flex flex-wrap gap-4">
            <Badge variant="outline" className={badges.semantic.success}>
              <CheckCircle className="h-3.5 w-3.5" />
              Success
            </Badge>
            <Badge variant="outline" className={badges.semantic.warning}>
              <AlertTriangle className="h-3.5 w-3.5" />
              Warning
            </Badge>
            <Badge variant="outline" className={badges.semantic.error}>
              <XCircle className="h-3.5 w-3.5" />
              Error
            </Badge>
            <Badge variant="outline" className={badges.semantic.info}>
              <Info className="h-3.5 w-3.5" />
              Info
            </Badge>
          </div>
        </div>

        {/* Atom Type Badges */}
        <div>
          <h4 className="font-medium mb-4">Atom Type Badges</h4>
          <div className="flex flex-wrap gap-4">
            {Object.keys(badges.atom).map((type) => (
              <Badge
                key={type}
                variant="outline"
                className={badges.atom[type as keyof typeof badges.atom]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h4 className="font-medium mb-2">Usage</h4>
        <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`import { badges } from '@/shared/tokens';
import { Badge } from '@/shared/ui/badge';
import { CheckCircle } from 'lucide-react';

<Badge variant="outline" className={badges.status.connected}>
  <CheckCircle className="h-3.5 w-3.5" />
  Connected
</Badge>`}
        </pre>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badge patterns combine colors with proper flex layout for icon + text. All are WCAG compliant.',
      },
    },
  },
};

/**
 * Card patterns for different use cases.
 */
export const CardPatterns: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Card Patterns</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Pre-styled card variants. Import: <code>import {'{ cards }'} from '@/shared/tokens';</code>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Default Card */}
        <div className={cards.default}>
          <h4 className="font-medium mb-2">Default Card</h4>
          <p className="text-sm text-muted-foreground">
            Standard card with shadow and padding. Use for static content.
          </p>
          <pre className="text-xs bg-muted p-2 rounded mt-4">cards.default</pre>
        </div>

        {/* Interactive Card */}
        <div className={cards.interactive}>
          <h4 className="font-medium mb-2">Interactive Card</h4>
          <p className="text-sm text-muted-foreground">
            Clickable card with hover effects and focus ring.
          </p>
          <pre className="text-xs bg-muted p-2 rounded mt-4">cards.interactive</pre>
        </div>

        {/* Empty Card */}
        <div className={cards.empty}>
          <h4 className="font-medium mb-2">Empty State Card</h4>
          <p className="text-sm text-muted-foreground">
            Dashed border for empty states and drop zones.
          </p>
          <pre className="text-xs bg-muted p-2 rounded mt-4">cards.empty</pre>
        </div>

        {/* Alert Cards */}
        <div className="space-y-4">
          <div className={cards.alert.info}>
            <p className="text-sm font-medium">Info Alert Card</p>
            <pre className="text-xs mt-2">cards.alert.info</pre>
          </div>
          <div className={cards.alert.success}>
            <p className="text-sm font-medium">Success Alert Card</p>
            <pre className="text-xs mt-2">cards.alert.success</pre>
          </div>
          <div className={cards.alert.warning}>
            <p className="text-sm font-medium">Warning Alert Card</p>
            <pre className="text-xs mt-2">cards.alert.warning</pre>
          </div>
          <div className={cards.alert.error}>
            <p className="text-sm font-medium">Error Alert Card</p>
            <pre className="text-xs mt-2">cards.alert.error</pre>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Empty state pattern for lists and pages.
 */
export const EmptyStatePattern: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Empty State Pattern</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Consistent empty state layout. Import: <code>import {'{ emptyState }'} from '@/shared/tokens';</code>
        </p>
      </div>

      <Card className="p-8">
        <div className={emptyState.container}>
          <div className={emptyState.icon}>
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className={emptyState.title}>No items yet</h3>
          <p className={emptyState.description}>
            When you add items, they will appear here.
            Get started by creating your first item.
          </p>
          <div className={emptyState.action}>
            <Button>Add First Item</Button>
          </div>
        </div>
      </Card>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h4 className="font-medium mb-2">Token Structure</h4>
        <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`emptyState.container   // flex flex-col items-center justify-center py-12 text-center
emptyState.icon        // rounded-full bg-muted p-4 mb-4
emptyState.title       // text-lg font-medium
emptyState.description // text-sm text-muted-foreground mt-1 max-w-sm
emptyState.action      // mt-4`}
        </pre>
      </div>
    </div>
  ),
};

/**
 * Loading patterns for skeleton states.
 */
export const LoadingPatterns: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Loading Patterns</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Skeleton and spinner patterns. Import: <code>import {'{ loading }'} from '@/shared/tokens';</code>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skeleton Patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Skeleton Patterns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Title</p>
              <Skeleton className={loading.skeleton.title} />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Text lines</p>
              <Skeleton className={loading.skeleton.text} />
              <Skeleton className={loading.skeleton.text} />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Avatar</p>
              <Skeleton className={loading.skeleton.avatar} />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Card</p>
              <Skeleton className={loading.skeleton.card} />
            </div>
          </CardContent>
        </Card>

        {/* Spinner Patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Spinner Containers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Centered spinner</p>
              <div className={`${loading.spinner.center} bg-muted rounded`}>
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Inline spinner</p>
              <div className={loading.spinner.inline}>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm">Loading...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  ),
};

/**
 * Form patterns for consistent form layouts.
 */
export const FormPatterns: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Form Patterns</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Form layout utilities. Import: <code>import {'{ forms }'} from '@/shared/tokens';</code>
        </p>
      </div>

      <Card className="max-w-md">
        <CardContent className="pt-6">
          <div className={forms.section}>
            <div className={forms.field}>
              <label className={forms.label.required}>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-2 border rounded"
              />
            </div>

            <div className={forms.field}>
              <label className={forms.label.default}>Password</label>
              <input
                type="password"
                placeholder="********"
                className="w-full px-4 py-2 border rounded"
              />
              <p className={forms.help}>Must be at least 8 characters</p>
            </div>

            <div className={forms.field}>
              <label className={forms.label.default}>Invalid Field</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-destructive rounded"
              />
              <p className={forms.error}>This field is required</p>
            </div>

            <div className={forms.inline}>
              <input type="checkbox" id="remember" />
              <label htmlFor="remember" className="text-sm">Remember me</label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
};

/**
 * List patterns for grids and divided lists.
 */
export const ListPatterns: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">List Patterns</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Grid and list layouts. Import: <code>import {'{ lists }'} from '@/shared/tokens';</code>
        </p>
      </div>

      <div className="space-y-8">
        {/* Responsive Grid */}
        <div>
          <h4 className="font-medium mb-4">Responsive Grid</h4>
          <p className="text-xs text-muted-foreground mb-4">lists.grid.responsive</p>
          <div className={lists.grid.responsive}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-4 text-center">
                Card {i}
              </Card>
            ))}
          </div>
        </div>

        {/* Dense Grid */}
        <div>
          <h4 className="font-medium mb-4">Dense Grid</h4>
          <p className="text-xs text-muted-foreground mb-4">lists.grid.dense</p>
          <div className={lists.grid.dense}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="p-2 text-center text-sm">
                {i}
              </Card>
            ))}
          </div>
        </div>

        {/* Divided List */}
        <div>
          <h4 className="font-medium mb-4">Divided List</h4>
          <p className="text-xs text-muted-foreground mb-4">lists.divided</p>
          <Card>
            <div className={lists.divided}>
              {['First item', 'Second item', 'Third item'].map((item) => (
                <div key={item} className="px-4">
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  ),
};

/**
 * Status indicator patterns for service health.
 */
export const StatusIndicatorPatterns: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Status Indicators</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Service health dots. Import: <code>import {'{ statusIndicators }'} from '@/shared/tokens';</code>
        </p>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <span className={statusIndicators.healthy} />
          <span className="text-sm">Healthy</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={statusIndicators.warning} />
          <span className="text-sm">Warning</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={statusIndicators.error} />
          <span className="text-sm">Error</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Status indicators include glow effects and pulse animation for warning/error states.
      </p>
    </div>
  ),
};

/**
 * Page layout patterns for different page types.
 */
export const PageLayoutPatterns: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Page Layouts</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Page wrapper variants. Import: <code>import {'{ pageLayouts }'} from '@/shared/tokens';</code>
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(pageLayouts).map(([key, value]) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="text-sm font-mono">{key}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`${value} bg-muted/50 border-2 border-dashed rounded p-4 min-h-24`}>
                <p className="text-sm text-muted-foreground">Content area</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {key === 'fullWidth' && 'Dashboard, Messages, Topics'}
                {key === 'centered' && 'Settings, Forms'}
                {key === 'wide' && 'Detail pages, Content-heavy pages'}
                {key === 'narrow' && 'Onboarding, Wizards'}
                {key === 'search' && 'Search page'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  ),
};

/**
 * Focus and transition patterns for interactions.
 */
export const InteractionPatterns: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Interaction Patterns</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Focus and transition utilities. Import: <code>import {'{ focus, transitions }'} from '@/shared/tokens';</code>
        </p>
      </div>

      <div className="space-y-8">
        {/* Focus Patterns */}
        <div>
          <h4 className="font-medium mb-4">Focus Patterns (WCAG 2.4.7)</h4>
          <div className="flex gap-4">
            <Button className={focus.ring}>
              Click and Tab to see focus
            </Button>
            <Button variant="secondary" className={focus.ring}>
              Another button
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Tab through buttons to see focus ring. All interactive elements must have visible focus.
          </p>
        </div>

        {/* Transition Patterns */}
        <div>
          <h4 className="font-medium mb-4">Transition Patterns</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              className={`${transitions.fast} hover:scale-105 bg-muted p-4 rounded cursor-pointer text-center`}
            >
              <p className="text-sm">Fast</p>
              <p className="text-xs text-muted-foreground">150ms</p>
            </div>
            <div
              className={`${transitions.default} hover:scale-105 bg-muted p-4 rounded cursor-pointer text-center`}
            >
              <p className="text-sm">Default</p>
              <p className="text-xs text-muted-foreground">200ms</p>
            </div>
            <div
              className={`${transitions.smooth} hover:scale-105 bg-muted p-4 rounded cursor-pointer text-center`}
            >
              <p className="text-sm">Smooth</p>
              <p className="text-xs text-muted-foreground">300ms ease-out</p>
            </div>
            <div
              className={`${transitions.colors} hover:bg-primary hover:text-primary-foreground bg-muted p-4 rounded cursor-pointer text-center`}
            >
              <p className="text-sm">Colors</p>
              <p className="text-xs text-muted-foreground">color only</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Base colors from shadcn/ui system.
 */
export const BaseColors: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Base Colors (shadcn/ui)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Core system colors. Import: <code>import {'{ base }'} from '@/shared/tokens';</code>
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <div className={`${base.primary.bg} p-4 rounded text-primary-foreground text-sm`}>
            primary
          </div>
          <p className="text-xs text-muted-foreground">Primary actions</p>
        </div>
        <div className="space-y-2">
          <div className={`${base.secondary.bg} p-4 rounded text-secondary-foreground text-sm`}>
            secondary
          </div>
          <p className="text-xs text-muted-foreground">Secondary actions</p>
        </div>
        <div className="space-y-2">
          <div className={`${base.muted.bg} p-4 rounded text-sm`}>
            muted
          </div>
          <p className="text-xs text-muted-foreground">Muted backgrounds</p>
        </div>
        <div className="space-y-2">
          <div className={`${base.accent.bg} p-4 rounded text-sm`}>
            accent
          </div>
          <p className="text-xs text-muted-foreground">Accent highlights</p>
        </div>
        <div className="space-y-2">
          <div className={`${base.destructive.bg} p-4 rounded text-destructive-foreground text-sm`}>
            destructive
          </div>
          <p className="text-xs text-muted-foreground">Destructive actions</p>
        </div>
        <div className="space-y-2">
          <div className={`${base.card.bg} p-4 rounded border text-sm`}>
            card
          </div>
          <p className="text-xs text-muted-foreground">Card backgrounds</p>
        </div>
        <div className="space-y-2">
          <div className={`${base.popover.bg} p-4 rounded border shadow-lg text-sm`}>
            popover
          </div>
          <p className="text-xs text-muted-foreground">Popover backgrounds</p>
        </div>
      </div>
    </div>
  ),
};

/**
 * Spacing stack and inline patterns.
 */
export const SpacingPatterns: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Spacing Patterns</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Vertical and horizontal spacing. Import: <code>import {'{ spacing }'} from '@/shared/tokens';</code>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Stack (vertical) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Stack (Vertical)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={spacing.stack.md}>
              <div className="bg-primary h-8 rounded" />
              <div className="bg-primary h-8 rounded" />
              <div className="bg-primary h-8 rounded" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">spacing.stack.md (space-y-4)</p>
          </CardContent>
        </Card>

        {/* Inline (horizontal) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Inline (Horizontal)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`flex ${spacing.inline.md}`}>
              <div className="bg-primary h-8 w-16 rounded" />
              <div className="bg-primary h-8 w-16 rounded" />
              <div className="bg-primary h-8 w-16 rounded" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">spacing.inline.md (space-x-4)</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <h4 className="font-medium mb-4">All Stack Sizes</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(spacing.stack).map(([key, value]) => (
            <div key={key} className="text-center">
              <div className={`${value} bg-muted p-2 rounded`}>
                <div className="bg-primary h-4 rounded" />
                <div className="bg-primary h-4 rounded" />
              </div>
              <p className="text-xs mt-2 font-mono">{key}</p>
              <p className="text-xs text-muted-foreground">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

/**
 * Margin utilities for external spacing.
 */
export const MarginUtilities: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Margin Utilities</h3>
        <p className="text-sm text-muted-foreground mb-4">
          External component spacing. Import: <code>import {'{ margin }'} from '@/shared/tokens';</code>
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(margin).map(([key, value]) => (
          <div key={key} className="flex items-center gap-4">
            <div className="w-16 text-sm font-mono">{key}</div>
            <div className="w-20 text-xs text-muted-foreground">{value}</div>
            <div className="bg-muted p-2 rounded">
              <div className={`${value} bg-primary p-4 rounded text-primary-foreground text-xs`}>
                Element
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};

/**
 * Button patterns for icon and text+icon combinations.
 */
export const ButtonPatterns: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Button Patterns</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Button size and layout patterns. Import: <code>import {'{ buttons }'} from '@/shared/tokens';</code>
        </p>
      </div>

      <div className="space-y-8">
        {/* Icon Buttons */}
        <div>
          <h4 className="font-medium mb-4">Icon Buttons (WCAG 2.5.5 Compliant)</h4>
          <div className="flex items-end gap-4">
            <div className="text-center">
              <Button variant="outline" className={buttons.icon.default} aria-label="Default icon">
                <CheckCircle className="h-5 w-5" />
              </Button>
              <p className="text-xs mt-2">default (44px)</p>
            </div>
            <div className="text-center">
              <Button variant="outline" className={buttons.icon.large} aria-label="Large icon">
                <CheckCircle className="h-5 w-5" />
              </Button>
              <p className="text-xs mt-2">large (48px)</p>
            </div>
          </div>
        </div>

        {/* Button with Icon */}
        <div>
          <h4 className="font-medium mb-4">Button with Icon + Text</h4>
          <div className="flex gap-4">
            <Button className={buttons.withIcon}>
              <CheckCircle className="h-4 w-4" />
              Save Changes
            </Button>
            <Button variant="outline" className={buttons.withIcon}>
              <XCircle className="h-4 w-4" />
              Cancel
            </Button>
            <Button variant="destructive" className={buttons.withIcon}>
              <AlertTriangle className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Avatar patterns for different sizes and badge positions.
 */
export const AvatarPatterns: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Avatar Patterns</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Avatar sizes and badge positions. Import: <code>import {'{ avatars }'} from '@/shared/tokens';</code>
        </p>
      </div>

      <div className="space-y-8">
        {/* Sizes */}
        <div>
          <h4 className="font-medium mb-4">Avatar Sizes</h4>
          <div className="flex items-end gap-4">
            {Object.entries(avatars.size).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className={`${value} bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium`}>
                  {key === 'sm' && 'S'}
                  {key === 'md' && 'M'}
                  {key === 'lg' && 'L'}
                  {key === 'xl' && 'XL'}
                </div>
                <p className="text-xs mt-2 font-mono">{key}</p>
                <p className="text-xs text-muted-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* With Badge */}
        <div>
          <h4 className="font-medium mb-4">Avatar with Badge</h4>
          <div className="flex gap-8">
            <div className="text-center">
              <div className={avatars.withBadge}>
                <div className={`${avatars.size.lg} bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium`}>
                  JD
                </div>
                <span className={`${avatars.badge.topRight} ${statusIndicators.healthy}`} />
              </div>
              <p className="text-xs mt-2">Online indicator</p>
            </div>
            <div className="text-center">
              <div className={avatars.withBadge}>
                <div className={`${avatars.size.lg} bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium`}>
                  AB
                </div>
                <span className={`${avatars.badge.bottomRight} bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center`}>
                  3
                </span>
              </div>
              <p className="text-xs mt-2">Notification count</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Spacing map for layout primitives.
 */
export const SpacingMapTokens: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Spacing Map</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Internal spacing values for layout primitives. Import: <code>import {'{ spacingMap }'} from '@/shared/tokens';</code>
        </p>
      </div>

      <table className="w-full text-sm">
        <thead className="text-left">
          <tr className="border-b">
            <th className="py-2 px-4">Token</th>
            <th className="py-2 px-4">Value</th>
            <th className="py-2 px-4">Pixels</th>
            <th className="py-2 px-4">Visual</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(spacingMap).map(([key, value]) => {
            const pixels = key === 'none' ? 0 : key === 'xs' ? 4 : key === 'sm' ? 8 : key === 'md' ? 16 : key === 'lg' ? 24 : key === 'xl' ? 32 : 48;
            return (
              <tr key={key} className="border-b">
                <td className="py-2 px-4 font-mono">{key}</td>
                <td className="py-2 px-4 font-mono text-muted-foreground">{value}</td>
                <td className="py-2 px-4">{pixels}px</td>
                <td className="py-2 px-4">
                  <div className="bg-primary h-4 rounded" style={{ width: `${Math.max(pixels, 4)}px` }} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  ),
};

/**
 * Z-Index classes for Tailwind usage.
 */
export const ZIndexClassesStory: Story = {
  name: 'Z-Index Classes',
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Z-Index Classes</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Tailwind class names for z-index. Import: <code>import {'{ zIndexClasses }'} from '@/shared/tokens';</code>
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(zIndexClasses).map(([key, value]) => (
          <Card key={key} className="text-center">
            <CardContent className="pt-4">
              <p className="font-mono text-sm">{key}</p>
              <p className="text-xs text-muted-foreground mt-1">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h4 className="font-medium mb-2">Usage</h4>
        <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`import { zIndexClasses } from '@/shared/tokens';

<div className={zIndexClasses.modal}>Modal content</div>
<div className={zIndexClasses.tooltip}>Tooltip</div>`}
        </pre>
      </div>
    </div>
  ),
};

/**
 * Complete token reference table.
 */
export const TokenReference: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Token Reference</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Quick reference for all available tokens.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left">
            <tr className="border-b">
              <th className="py-2 px-4">Category</th>
              <th className="py-2 px-4">Import</th>
              <th className="py-2 px-4">Example</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2 px-4 font-medium">Semantic Colors</td>
              <td className="py-2 px-4 font-mono text-xs">semantic</td>
              <td className="py-2 px-4 font-mono text-xs">semantic.success.bg</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 font-medium">Status Colors</td>
              <td className="py-2 px-4 font-mono text-xs">status</td>
              <td className="py-2 px-4 font-mono text-xs">status.connected.text</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 font-medium">Atom Colors</td>
              <td className="py-2 px-4 font-mono text-xs">atom</td>
              <td className="py-2 px-4 font-mono text-xs">atom.insight.border</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 font-medium">Chart Colors</td>
              <td className="py-2 px-4 font-mono text-xs">chart</td>
              <td className="py-2 px-4 font-mono text-xs">chart.signal.fill</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 font-medium">Gap</td>
              <td className="py-2 px-4 font-mono text-xs">gap</td>
              <td className="py-2 px-4 font-mono text-xs">gap.md (16px)</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 font-medium">Padding</td>
              <td className="py-2 px-4 font-mono text-xs">padding</td>
              <td className="py-2 px-4 font-mono text-xs">padding.card.default</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 font-medium">Touch Targets</td>
              <td className="py-2 px-4 font-mono text-xs">touchTarget</td>
              <td className="py-2 px-4 font-mono text-xs">touchTarget.min (44px)</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 font-medium">Z-Index</td>
              <td className="py-2 px-4 font-mono text-xs">zIndex, zIndexClasses</td>
              <td className="py-2 px-4 font-mono text-xs">zIndex.modal (50)</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 font-medium">Badge Patterns</td>
              <td className="py-2 px-4 font-mono text-xs">badges</td>
              <td className="py-2 px-4 font-mono text-xs">badges.status.connected</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 font-medium">Card Patterns</td>
              <td className="py-2 px-4 font-mono text-xs">cards</td>
              <td className="py-2 px-4 font-mono text-xs">cards.interactive</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 font-medium">Empty State</td>
              <td className="py-2 px-4 font-mono text-xs">emptyState</td>
              <td className="py-2 px-4 font-mono text-xs">emptyState.container</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 font-medium">Loading</td>
              <td className="py-2 px-4 font-mono text-xs">loading</td>
              <td className="py-2 px-4 font-mono text-xs">loading.skeleton.text</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 font-medium">Forms</td>
              <td className="py-2 px-4 font-mono text-xs">forms</td>
              <td className="py-2 px-4 font-mono text-xs">forms.label.required</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 font-medium">Lists</td>
              <td className="py-2 px-4 font-mono text-xs">lists</td>
              <td className="py-2 px-4 font-mono text-xs">lists.grid.responsive</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 font-medium">Focus</td>
              <td className="py-2 px-4 font-mono text-xs">focus</td>
              <td className="py-2 px-4 font-mono text-xs">focus.ring</td>
            </tr>
            <tr>
              <td className="py-2 px-4 font-medium">Transitions</td>
              <td className="py-2 px-4 font-mono text-xs">transitions</td>
              <td className="py-2 px-4 font-mono text-xs">transitions.smooth</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h4 className="font-medium mb-2">Import All Tokens</h4>
        <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`import {
  // Colors
  semantic, status, atom, chart, brand, base,
  // Spacing
  gap, padding, margin, spacing, touchTarget, radius,
  // Z-Index
  zIndex, zIndexClasses,
  // Patterns
  badges, cards, buttons, loading, emptyState,
  forms, lists, avatars, focus, transitions,
  pageLayouts, statusIndicators,
} from '@/shared/tokens';`}
        </pre>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete reference of all available design tokens with import paths and usage examples.',
      },
    },
  },
};
