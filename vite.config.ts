import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// Relative base so Capacitor Android WebView resolves ./assets/* from the packaged index.html.
// Vite supports this for dev + production (see Vite `base` docs).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
