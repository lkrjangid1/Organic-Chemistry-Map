# Organic Chemistry Map

Free organic chemistry notes and an interactive reaction map for JEE Main, JEE Advanced and NEET. One verified page per reaction, written from Lokesh Jangid's handwritten classroom notes and checked against trusted references, plus a zoomable map where nodes are compounds and arrows are reactions.

**Live:** https://organic-chemistry-map.yaaratech.in/ · interactive map: [/map/](https://organic-chemistry-map.yaaratech.in/map/)

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.1.1-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)

<img width="1680" height="932" alt="image" src="https://github.com/user-attachments/assets/28d5f1c4-aa77-45fa-bc34-23973f4f4e41" />


## Features

### Interactive Map
- Pan and zoom with mouse, trackpad, or touch gestures
- React Flow driven node and edge visualization
- Smooth transitions and selection feedback to keep context while exploring
- Remembers your last zoom level and position so the map reopens exactly where you left it

### Chemical Structures
- SMILES Drawer renders molecule diagrams for each compound
- Rich metadata including IUPAC names, formulae, and notes
- Visual state highlighting for the active pathway

### Search and Filter
- Live search suggestions for compounds and reactions with quick jump navigation
- Google Maps-style fly-to animation that zooms directly to the selected node or edge
- Reaction type filtering to narrow the visible network

### Responsive Design
- Mobile friendly layout with safe-area padding and fixed header
- Consistent React Flow controls across screen sizes
- Tailwind CSS theming with coordinated light and dark palettes

### Contextual Side Panel
- Theme-aware glassmorphism shell that automatically adapts to light and dark palettes
- Grouped “Compounds” and “Reactions” suggestion lists with chem-specific iconography
- Inline controls for reaction filters plus quick tips for map interaction

## Site structure

| Path | What it is |
|------|------------|
| `/` | Home page |
| `/reactions/` | A–Z index of every reaction; `/reactions/<slug>/` is one verified page per reaction |
| `/mechanisms/` | Hub pages per mechanism family (SN1/SN2, elimination, rearrangements…) |
| `/compounds/` | Compounds that appear in 3+ reactions: structure, preparation, reactions |
| `/notes/` | Free PDF of the original handwritten notes |
| `/map/` | The interactive React Flow map (`/app/` redirects here, keeping `?reaction=` / `?compound=` deep links) |

Built with [Astro](https://astro.build): every content page is static HTML (crawlable, fast); the map is a React island.

## Quick Start

```bash
npm install
npm run dev            # http://localhost:4321
npm run build          # static site in dist/
npm run check:content  # validate content MDX (frontmatter, SMILES, equations, links)
npm run check:site     # post-build SEO + link checks over dist/
```

Node 22.23+ is required (Astro 7).

## Adding or editing a reaction page

1. Create `src/content/reactions/<slug>.mdx`. Copy the frontmatter of an existing page; the schema is in `src/content.config.ts`.
2. Every page needs at least **2 trusted sources** (NCERT, LibreTexts, Organic Chemistry Portal, Wikipedia/primary literature, IUPAC). Coaching and Q&A sites are not accepted.
3. Link the page to map arrows with `mapEdges` (edge ids from `src/app/data/jee_organic.json`).
4. Body components: `<Eq ce="..."/>` (mhchem equation), `<Mol smiles="..." name="..."/>`, `<KeyPoint>`, `<ExamTip>`, `<Trick>`.
5. Run `npm run check:content` and `npm run build`.

Molecule structures are drawn at build time with RDKit (SVG), equations with KaTeX + mhchem.

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) builds, validates and deploys to GitHub Pages on every push to `main`; pull requests are built and checked but not deployed. Optional repository variables:

| Variable | Purpose |
|----------|---------|
| `GOOGLE_SITE_VERIFICATION` | Search Console HTML-tag verification code |
| `CF_ANALYTICS_TOKEN` | Cloudflare Web Analytics token (cookie-free) |
| `REPORT_FORM_URL` / `REPORT_FORM_PAGE_FIELD` | Google Form for "Report an error" and the prefill field id for the page URL |

## Technology Stack

| Component | Technology |
|-----------|------------|
| Site | Astro 7 + MDX content collections |
| Map | React 19, React Flow 11, Zustand 5, Tailwind CSS 4 |
| Structures | RDKit (build-time SVG) and SMILES Drawer (map) |
| Equations | KaTeX + mhchem |
