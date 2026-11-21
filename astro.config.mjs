import process from 'node:process'
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'

// SITE_URL / BASE_PATH come from the Pages workflow (actions/configure-pages).
const site = (process.env.SITE_URL || 'https://organic-chemistry-map.yaaratech.in').replace(/\/$/, '')
const base = process.env.BASE_PATH || '/'

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    react(),
    mdx(),
    sitemap({
      filter: (page) => !/\/app\/$/.test(page) && !/\/404\/?$/.test(page),
    }),
  ],
  vite: {
    server: { allowedHosts: ['dazedly-combative-alisson.ngrok-free.dev'] },
  },
})
