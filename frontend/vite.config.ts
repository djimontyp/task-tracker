import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './src/app'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@features': path.resolve(__dirname, './src/features'),
      '@entities': path.resolve(__dirname, './src/entities'),
      '@widgets': path.resolve(__dirname, './src/widgets'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/e2e/**',
      '**/*.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        '**/*.stories.tsx',
        '**/*.d.ts',
        '**/tests/**',
        '**/*.config.*',
        '**/main.tsx',
        '**/vite-env.d.ts',
      ],
      // Current baseline thresholds - increase as coverage improves
      // Target: 70% across all metrics
      thresholds: {
        lines: 46,
        functions: 19,
        branches: 22,
        statements: 46,
      },
    },
  },

  server: {
    port: 3000,
    host: true, // Listen on all addresses (for Docker)
    strictPort: true,
    // Allow any host (ngrok, tunnels, custom domains)
    // Safe because we're behind nginx reverse proxy
    allowedHosts: 'all',
    watch: {
      usePolling: true, // Required for Docker
    },
    // HMR configuration for reverse proxy (nginx, ngrok)
    // Client connects via the same host/port as the page (through nginx)
    hmr: {
      // Use the page's origin for WebSocket connection
      // This works for: localhost:80, ngrok:443, any reverse proxy
      // Nginx proxies /@vite/* and / with WebSocket upgrade headers
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
          'data-vendor': ['@tanstack/react-query', '@tanstack/react-table', 'axios'],
        },
      },
    },
  },

  preview: {
    port: 3000,
    host: true,
  },
})
