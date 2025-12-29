/**
 * Lighthouse CI Configuration
 *
 * Performance budgets based on Core Web Vitals guidelines:
 * - LCP < 2.5s (good), < 4s (needs improvement)
 * - CLS < 0.1 (good), < 0.25 (needs improvement)
 * - FCP < 1.8s (good), < 3s (needs improvement)
 *
 * @see https://web.dev/vitals/
 */
module.exports = {
  ci: {
    collect: {
      // Serve built files
      staticDistDir: './dist',
      // Number of runs per URL for more stable results
      numberOfRuns: 3,
      // URLs to test
      url: [
        'http://localhost/',
        'http://localhost/dashboard',
        'http://localhost/topics',
        'http://localhost/atoms',
      ],
    },
    assert: {
      assertions: {
        // Core Web Vitals budgets (error = fail CI, warn = warning only)
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'speed-index': ['warn', { maxNumericValue: 3400 }],
        interactive: ['warn', { maxNumericValue: 3800 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],

        // Category scores (0-1 scale)
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.85 }],

        // Resource budgets (bytes)
        'resource-summary:script:size': ['warn', { maxNumericValue: 500000 }], // 500KB
        'resource-summary:stylesheet:size': ['warn', { maxNumericValue: 100000 }], // 100KB
        'resource-summary:total:size': ['warn', { maxNumericValue: 1500000 }], // 1.5MB
      },
    },
    upload: {
      // Upload to temporary public storage for PR comments
      target: 'temporary-public-storage',
    },
  },
};
