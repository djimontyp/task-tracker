const path = require('path')

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@app': path.resolve(__dirname, 'src/app'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@widgets': path.resolve(__dirname, 'src/widgets'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@entities': path.resolve(__dirname, 'src/entities'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  jest: {
    configure: {
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@app/(.*)$': '<rootDir>/src/app/$1',
        '^@pages/(.*)$': '<rootDir>/src/pages/$1',
        '^@widgets/(.*)$': '<rootDir>/src/widgets/$1',
        '^@features/(.*)$': '<rootDir>/src/features/$1',
        '^@entities/(.*)$': '<rootDir>/src/entities/$1',
        '^@shared/(.*)$': '<rootDir>/src/shared/$1',
      },
    },
  },
}
