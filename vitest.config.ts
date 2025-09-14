import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [resolve(__dirname, './tests/setup/polyfills.ts')],
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
      '@': resolve(__dirname, './src'),
      // Shim jsdom to avoid import-time issues on Node 18
      jsdom: resolve(__dirname, './tests/shims/jsdom.ts')
    }
  }
});
