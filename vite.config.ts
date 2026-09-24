import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [sveltekit()],
  // 3002: clear of qacart-todo (3001) so both can run side by side.
  server: { port: 3002 },
  preview: { port: 3002 },
})
