import type { Preview } from '@storybook/react-vite';
import { withThemeByClassName } from '@storybook/addon-themes';
import { I18nextProvider } from 'react-i18next';
import i18n from '../src/i18n';
import '../src/index.css';

/**
 * Storybook Preview Configuration
 *
 * Integrates with Pulse Radar Design System:
 * - Tailwind CSS with semantic tokens
 * - Dark mode toggle
 * - Responsive viewports (mobile-first)
 * - WCAG 2.1 AA accessibility testing
 * - Chromatic visual regression testing
 * - i18n support (UK/EN)
 */

// Viewport definitions matching tailwind.config.js
const viewports = {
  xs: { name: 'XS Phone (375px)', styles: { width: '375px', height: '667px' } },
  sm: { name: 'SM Phone (640px)', styles: { width: '640px', height: '800px' } },
  md: { name: 'MD Tablet (768px)', styles: { width: '768px', height: '1024px' } },
  lg: { name: 'LG Laptop (1024px)', styles: { width: '1024px', height: '768px' } },
  xl: { name: 'XL Desktop (1280px)', styles: { width: '1280px', height: '900px' } },
  '2xl': { name: '2XL Large (1536px)', styles: { width: '1536px', height: '960px' } },
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Responsive viewports
    viewport: {
      viewports,
      defaultViewport: 'lg',
    },
    // Background colors matching design system
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: 'hsl(0 0% 100%)' },
        { name: 'dark', value: 'hsl(20 14.3% 4.1%)' },
        { name: 'muted', value: 'hsl(60 4.8% 95.9%)' },
      ],
    },
    // Docs settings
    docs: {
      toc: true,
    },
    // Accessibility addon settings
    a11y: {
      config: {
        rules: [
          // WCAG 2.1 AA compliance
          { id: 'color-contrast', enabled: true },
          { id: 'button-name', enabled: true },
          { id: 'image-alt', enabled: true },
        ],
      },
    },
    // Chromatic configuration
    chromatic: {
      // Capture at multiple viewports for visual regression
      viewports: [375, 768, 1280],
      // Disable animations for consistent snapshots
      pauseAnimationAtEnd: true,
      // Modes for theme testing
      modes: {
        light: { theme: 'light' },
        dark: { theme: 'dark', className: 'dark' },
      },
    },
  },
  // Global decorators
  decorators: [
    // Theme switching via addon-themes (adds 'dark' class to document)
    withThemeByClassName({
      themes: {
        light: '',
        dark: 'dark',
      },
      defaultTheme: 'light',
    }),
    // Wrapper for consistent background/foreground from CSS variables
    (Story) => (
      <div className="bg-background text-foreground min-h-screen p-4">
        <Story />
      </div>
    ),
    // i18n provider for internationalized components
    (Story) => (
      <I18nextProvider i18n={i18n}>
        <Story />
      </I18nextProvider>
    ),
  ],
};

export default preview;
