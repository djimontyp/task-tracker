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
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      screens: {
        xs: "375px",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "fade-in-up": "fade-in-up 0.4s ease-out",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};
