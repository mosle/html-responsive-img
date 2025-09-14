import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        browser: resolve(__dirname, 'src/browser/index.ts'),
        cli: resolve(__dirname, 'src/cli/index.ts')
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        if (format === 'cjs') {
          return `${entryName}.cjs`;
        }
        return `${entryName}.js`;
      }
    },
    rollupOptions: {
      external: ['node-html-parser', 'fs', 'path', 'url'],
      output: {
        globals: {
          'node-html-parser': 'HTMLParser'
        }
      }
    },
    target: 'es2020',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});