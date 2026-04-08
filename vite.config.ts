import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  server: {
    allowedHosts: ["d7a3-2401-4900-5c52-a280-641f-598c-8700-4d89.ngrok-free.app"]
  }
})