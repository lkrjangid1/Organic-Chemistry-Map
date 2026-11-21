import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// BASE_PATH is set by the GitHub Pages workflow (e.g. "/Organic-Chemistry-Map/").
// Defaults to "/" for local dev and root-domain hosting.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    allowedHosts: [
      'dazedly-combative-alisson.ngrok-free.dev',
    ],
  },
})
