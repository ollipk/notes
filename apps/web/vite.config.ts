/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, searchForWorkspaceRoot } from 'vite';

// `base` matches the GitHub Pages project path: https://ollipk.github.io/notes/
export default defineConfig({
  base: '/notes/',
  plugins: [react(), tailwindcss()],
  server: {
    // The dev server may serve files from the whole repository: tunes/ and packages/ are outside
    // apps/web (ADR 11).
    fs: { allow: [searchForWorkspaceRoot(process.cwd())] },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
