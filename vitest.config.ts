import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.config.ts',
        'tests/**',
        '**/*.d.ts'
      ],
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90
      }
    },
    include: ['tests/**/*.test.ts'],
    watchExclude: ['node_modules/**', 'dist/**']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});