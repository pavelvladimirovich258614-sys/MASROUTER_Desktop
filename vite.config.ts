import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  base: './',
  build: {
    outDir: resolve(__dirname, 'dist/renderer'),
    emptyOutDir: true,
    target: 'chrome120',
    sourcemap: true
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'shared'),
      '@renderer': resolve(__dirname, 'src/renderer'),
      '@preload': resolve(__dirname, 'src/preload')
    }
  },
  server: {
    port: 5173,
    strictPort: true
  },
  plugins: [react()],
  test: {
    root: resolve(__dirname),
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts', 'shared/**/*.test.ts'],
    globals: false
  }
});
