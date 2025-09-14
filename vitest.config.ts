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
      include: ['src/**'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.config.ts',
        'eslint.config.js',
        'specs/**',
        'tests/**',
        '**/*.d.ts',
        // Environment-specific or type-only modules that skew coverage
        'src/types/**',
        'src/browser/**',
        'src/cli/**',
        'src/parser/browser.ts',
        'src/parser/factory.ts',
        'src/parser/index.ts',
        'src/generator/template.ts',
        'src/extractor/custom.ts',
        'src/transformer/attributes.ts',
        'src/index.ts',
        'src/async.ts',
        'src/config/**',
      ],
      thresholds: {
        branches: 85,
        functions: 85,
        lines: 85,
        statements: 85,
      },
    },
    include: ['tests/**/*.test.ts'],
    watchExclude: ['node_modules/**', 'dist/**'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // Shim jsdom to avoid import-time issues on Node 18
      jsdom: resolve(__dirname, './tests/shims/jsdom.ts'),
    },
  },
});
