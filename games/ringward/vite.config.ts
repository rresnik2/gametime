import { defineConfig } from 'vite';

// Relative base so the build works from any static host path (Vercel, OBS browser source, file).
export default defineConfig({
  base: './',
});
