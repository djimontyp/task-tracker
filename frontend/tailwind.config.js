/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
        xl: '2.5rem',
        '2xl': '3rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
        '4xl': '2560px',
      },
    },
    extend: {
      screens: {
        xs: "375px",
        '3xl': '1920px',
        '4xl': '2560px',
      },
      fontFamily: {
        sans: ['Raleway', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          bright: "hsl(var(--primary-bright))",
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
          // Card typography colors - WCAG AA compliant
          title: "hsl(var(--card-title))",
          body: "hsl(var(--card-body))",
          label: "hsl(var(--card-label))",
          value: "hsl(var(--card-value))",
          muted: "hsl(var(--card-muted))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
          "active-indicator": "hsl(var(--sidebar-active-indicator))",
        },
        atom: {
          problem: "hsl(var(--atom-problem))",
          solution: "hsl(var(--atom-solution))",
          decision: "hsl(var(--atom-decision))",
          question: "hsl(var(--atom-question))",
          insight: "hsl(var(--atom-insight))",
          pattern: "hsl(var(--atom-pattern))",
          requirement: "hsl(var(--atom-requirement))",
        },
        status: {
          connected: "hsl(var(--status-connected))",
          validating: "hsl(var(--status-validating))",
          pending: "hsl(var(--status-pending))",
          error: "hsl(var(--status-error))",
        },
        semantic: {
          success: "hsl(var(--semantic-success))",
          warning: "hsl(var(--semantic-warning))",
          error: "hsl(var(--semantic-error))",
          info: "hsl(var(--semantic-info))",
        },
        chart: {
          signal: "hsl(var(--chart-signal))",
          noise: "hsl(var(--chart-noise))",
          "weak-signal": "hsl(var(--chart-weak-signal))",
        },
        brand: {
          telegram: "hsl(var(--brand-telegram))",
        },
        topic: {
          default: "hsl(var(--topic-default))",
        },
        highlight: {
          DEFAULT: "hsl(var(--highlight))",
        },
        heatmap: {
          "level-0": "hsl(var(--heatmap-level-0))",
          "level-1": "hsl(var(--heatmap-level-1))",
          "level-2": "hsl(var(--heatmap-level-2))",
          "level-3": "hsl(var(--heatmap-level-3))",
          "level-4": "hsl(var(--heatmap-level-4))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      letterSpacing: {
        tight: "-0.01em",
        normal: "0em",
        relaxed: "0.015em",
        loose: "0.025em",
        "extra-loose": "0.05em",
      },
      boxShadow: {
        // Subtle permanent glow (for cards at rest)
        glow: "0 0 25px hsl(var(--accent-glow) / 2), 0 0 50px hsl(var(--accent-glow))",
        // Stronger hover glow
        "glow-hover": "0 0 35px hsl(var(--accent-glow) / 2.5), 0 0 70px hsl(var(--accent-glow) / 1.5)",
        // Small subtle glow
        "glow-sm": "0 0 15px hsl(var(--accent-glow) / 1.5), 0 0 30px hsl(var(--accent-glow) / 0.5)",
        // Large prominent glow
        "glow-lg": "0 0 50px hsl(var(--accent-glow) / 2.5), 0 0 100px hsl(var(--accent-glow) / 1.5)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "radar-sweep": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "orbit": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "orbit-reverse": {
          "0%": { transform: "rotate(360deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "fade-in-up": "fade-in-up 0.4s ease-out",
        "spin-slow": "spin 2s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "radar-sweep": "radar-sweep 2s linear infinite",
        "orbit-slow": "orbit 8s linear infinite",
        "orbit-medium": "orbit 6s linear infinite",
        "orbit-reverse": "orbit-reverse 10s linear infinite",
      },
      zIndex: {
        // Design System z-index tokens
        // See: frontend/src/shared/tokens/zindex.ts
        'base': '0',
        'dropdown': '10',
        'sticky': '20',
        'fixed': '30',
        'modal-backdrop': '40',
        'modal': '50',
        'popover': '60',
        'tooltip': '70',
        'toast': '80',
        'max': '9999',
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};
