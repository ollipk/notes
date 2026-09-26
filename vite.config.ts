/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// `base` matches the GitHub Pages project path: https://ollipk.github.io/notes/
export default defineConfig({
  base: '/notes/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
