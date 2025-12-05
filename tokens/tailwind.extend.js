/**
 * Pulse Radar Design Tokens - Tailwind CSS Extension
 *
 * Copy this into your tailwind.config.js `extend` section
 * or import directly: const extend = require('../tokens/tailwind.extend.js')
 *
 * @version 1.0.0
 * @see docs/design-system/
 */

module.exports = {
  // ========================
  // COLORS
  // ========================
  colors: {
    // Core semantic colors (from CSS variables)
    border: "hsl(var(--border))",
    input: "hsl(var(--input))",
    ring: "hsl(var(--ring))",
    background: "hsl(var(--background))",
    foreground: "hsl(var(--foreground))",

    primary: {
      DEFAULT: "hsl(var(--primary))",
      foreground: "hsl(var(--primary-foreground))",
    },
    secondary: {
      DEFAULT: "hsl(var(--secondary))",
      foreground: "hsl(var(--secondary-foreground))",
    },
    destructive: {
      DEFAULT: "hsl(var(--destructive))",
      foreground: "hsl(var(--destructive-foreground))",
    },
    muted: {
      DEFAULT: "hsl(var(--muted))",
      foreground: "hsl(var(--muted-foreground))",
    },
    accent: {
      DEFAULT: "hsl(var(--accent))",
      foreground: "hsl(var(--accent-foreground))",
    },
    popover: {
      DEFAULT: "hsl(var(--popover))",
      foreground: "hsl(var(--popover-foreground))",
    },
    card: {
      DEFAULT: "hsl(var(--card))",
      foreground: "hsl(var(--card-foreground))",
    },

    // Sidebar colors
    sidebar: {
      DEFAULT: "hsl(var(--sidebar-background))",
      foreground: "hsl(var(--sidebar-foreground))",
      primary: "hsl(var(--sidebar-primary))",
      "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
      accent: "hsl(var(--sidebar-accent))",
      "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
      border: "hsl(var(--sidebar-border))",
      ring: "hsl(var(--sidebar-ring))",
    },

    // Atom type semantic colors
    atom: {
      problem: "hsl(var(--atom-problem))",
      solution: "hsl(var(--atom-solution))",
      decision: "hsl(var(--atom-decision))",
      question: "hsl(var(--atom-question))",
      insight: "hsl(var(--atom-insight))",
      pattern: "hsl(var(--atom-pattern))",
      requirement: "hsl(var(--atom-requirement))",
    },

    // Status indicator colors
    status: {
      connected: "hsl(var(--status-connected))",
      validating: "hsl(var(--status-validating))",
      pending: "hsl(var(--status-pending))",
      error: "hsl(var(--status-error))",
    },

    // Heatmap colors
    heatmap: {
      telegram: "hsl(var(--heatmap-telegram))",
      slack: "hsl(var(--heatmap-slack))",
      email: "hsl(var(--heatmap-email))",
    },
  },

  // ========================
  // TYPOGRAPHY
  // ========================
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
  },

  fontSize: {
    // Mobile-first responsive scale
    'xs': ['0.75rem', { lineHeight: '1rem' }],       // 12px
    'sm': ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
    'base': ['1rem', { lineHeight: '1.5rem' }],      // 16px
    'lg': ['1.125rem', { lineHeight: '1.75rem' }],   // 18px
    'xl': ['1.25rem', { lineHeight: '1.75rem' }],    // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],       // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],  // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],    // 36px
  },

  // ========================
  // SPACING (4px grid)
  // ========================
  spacing: {
    // Keep Tailwind defaults but ensure 4px grid
    // 0.5: 2px, 1: 4px, 1.5: 6px, 2: 8px, etc.
    // Custom additions for touch targets
    '11': '2.75rem',  // 44px - touch target minimum
    '13': '3.25rem',  // 52px
    '15': '3.75rem',  // 60px
  },

  // ========================
  // BORDER RADIUS
  // ========================
  borderRadius: {
    lg: "var(--radius)",
    md: "calc(var(--radius) - 2px)",
    sm: "calc(var(--radius) - 4px)",
    // Additional semantic radii
    button: "6px",
    card: "8px",
    modal: "12px",
    pill: "9999px",
  },

  // ========================
  // SHADOWS
  // ========================
  boxShadow: {
    card: "var(--shadow-card)",
    // Elevation system
    'elevation-0': 'var(--elevation-0)',
    'elevation-1': 'var(--elevation-1)',
    'elevation-2': 'var(--elevation-2)',
    'elevation-3': 'var(--elevation-3)',
    'elevation-4': 'var(--elevation-4)',
  },

  // ========================
  // Z-INDEX
  // ========================
  zIndex: {
    'dropdown': '10',
    'sticky': '20',
    'fixed': '30',
    'modal-backdrop': '40',
    'modal': '50',
    'tooltip': '60',
    'toast': '70',
  },

  // ========================
  // TRANSITIONS
  // ========================
  transitionDuration: {
    'instant': '75ms',
    'fast': '150ms',
    'normal': '200ms',
    'slow': '300ms',
    'slower': '500ms',
  },

  transitionTimingFunction: {
    'default': 'cubic-bezier(0.4, 0, 0.2, 1)',
    'in': 'cubic-bezier(0.4, 0, 1, 1)',
    'out': 'cubic-bezier(0, 0, 0.2, 1)',
    'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // ========================
  // ANIMATIONS
  // ========================
  keyframes: {
    "fade-in": {
      "0%": { opacity: "0" },
      "100%": { opacity: "1" },
    },
    "fade-in-up": {
      "0%": { opacity: "0", transform: "translateY(10px)" },
      "100%": { opacity: "1", transform: "translateY(0)" },
    },
    "fade-out": {
      "0%": { opacity: "1" },
      "100%": { opacity: "0" },
    },
    "slide-in-right": {
      "0%": { transform: "translateX(100%)" },
      "100%": { transform: "translateX(0)" },
    },
    "slide-in-left": {
      "0%": { transform: "translateX(-100%)" },
      "100%": { transform: "translateX(0)" },
    },
    "scale-in": {
      "0%": { opacity: "0", transform: "scale(0.95)" },
      "100%": { opacity: "1", transform: "scale(1)" },
    },
    "shimmer": {
      "0%": { backgroundPosition: "-200% 0" },
      "100%": { backgroundPosition: "200% 0" },
    },
  },

  animation: {
    "fade-in": "fade-in 0.2s ease-out",
    "fade-in-up": "fade-in-up 0.3s ease-out",
    "fade-out": "fade-out 0.2s ease-in",
    "slide-in-right": "slide-in-right 0.3s ease-out",
    "slide-in-left": "slide-in-left 0.3s ease-out",
    "scale-in": "scale-in 0.2s ease-out",
    "shimmer": "shimmer 2s infinite linear",
  },

  // ========================
  // SCREENS (Breakpoints)
  // ========================
  screens: {
    'xs': '375px',    // Extra small (mobile)
    'sm': '640px',    // Small (mobile landscape)
    'md': '768px',    // Medium (tablet)
    'lg': '1024px',   // Large (laptop)
    'xl': '1280px',   // Extra large (desktop)
    '2xl': '1536px',  // 2X large (large desktop)
  },

  // ========================
  // CONTAINER
  // ========================
  container: {
    center: true,
    padding: {
      DEFAULT: '1rem',
      sm: '1.5rem',
      lg: '2rem',
    },
    screens: {
      '2xl': '1400px',
    },
  },
};
