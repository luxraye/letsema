import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// BASE lets the same build run at a domain root or under a sub-path (e.g. GitHub Pages).
export default defineConfig({
  base: process.env.BASE ?? './',
  plugins: [react(), tailwindcss()],
  build: { target: 'es2022', sourcemap: false, chunkSizeWarningLimit: 900 },
});
