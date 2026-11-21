import { resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {
  applyReplacements,
  buildHomeReplacements,
  buildSitemap,
  loadDataset,
} from './scripts/seo/home.mjs'

const root = fileURLToPath(new URL('.', import.meta.url))

// BASE_PATH and SITE_URL are set by the GitHub Pages workflow from the repo's
// Pages settings (custom domain => "/", project page => "/<repo>/").
// Defaults to "/" for local dev and root-domain hosting.
const base = process.env.BASE_PATH || '/'

// Absolute public URL of the site, used for canonical/OG tags and the sitemap.
const siteUrl = (process.env.SITE_URL || 'https://organic-chemistry-map.yaaratech.in').replace(/\/?$/, '/')

/** Injects the generated, crawlable content into the static home page. */
const seoHomePage = () => ({
  name: 'seo-home-page',
  transformIndexHtml(html, ctx) {
    const file = ctx.filename ? resolve(ctx.filename) : ''
    if (file !== resolve(root, 'index.html')) {
      return applyReplacements(html, { '%SITE_URL%': siteUrl })
    }
    const data = loadDataset(resolve(root, 'src/data/jee_organic.json'))
    const verification = process.env.GOOGLE_SITE_VERIFICATION
      ? `<meta name="google-site-verification" content="${process.env.GOOGLE_SITE_VERIFICATION.replace(/[^\w-]/g, '')}" />`
      : ''
    return applyReplacements(html, {
      ...buildHomeReplacements({ data, siteUrl }),
      '<!-- @site-verification -->': verification,
    })
  },
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: buildSitemap(siteUrl) })
    this.emitFile({
      type: 'asset',
      fileName: 'robots.txt',
      source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`,
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    seoHomePage(),
  ],
  build: {
    rollupOptions: {
      input: {
        home: resolve(root, 'index.html'),
        app: resolve(root, 'app/index.html'),
      },
    },
  },
  server: {
    allowedHosts: [
      'dazedly-combative-alisson.ngrok-free.dev',
    ],
  },
})
