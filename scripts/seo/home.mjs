/**
 * Build-time generator for the static, crawlable home page.
 *
 * Reads the reaction dataset and turns it into plain HTML (reaction index,
 * compound classes, stats) plus JSON-LD structured data, so search engines
 * see the full content without executing JavaScript.
 */
import { readFileSync } from 'node:fs';

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const titleCase = (value) =>
  value
    .trim()
    .split(/\s+/)
    .map((word) => (/^[a-z]/.test(word) ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');

const slugify = (value) =>
  value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const FAQ = [
  {
    q: 'Is Organic Chemistry Map free to use?',
    a: 'Yes. It is completely free, needs no sign-up, and is open source on GitHub. You can also install it as an app on your phone or laptop and use it offline.',
  },
  {
    q: 'Is this useful for JEE Main or only for JEE Advanced?',
    a: 'Both. JEE Main questions focus on standard NCERT conversions such as Aldol condensation, Cannizzaro, Hofmann bromamide degradation, Reimer–Tiemann and Friedel–Crafts reactions, all of which are on the map. JEE Advanced aspirants can go further with rearrangements, stereospecific eliminations and multi-step conversion chains.',
  },
  {
    q: 'Can NEET aspirants use this organic chemistry map?',
    a: 'Yes. NEET organic chemistry is NCERT-based and heavily tests named reactions, reagents and conversions between functional groups such as alcohols, aldehydes, ketones, carboxylic acids and amines. The map shows exactly these links, with reagents and conditions for each step.',
  },
  {
    q: 'How do I use the map to solve conversion (road map) questions?',
    a: 'Search for the starting compound, then follow the reaction arrows to the product you need. Each arrow shows the reagent and conditions, so a multi-step conversion becomes a path you can trace and revise visually.',
  },
  {
    q: 'What information is shown for each reaction?',
    a: 'Every reaction lists its reagents and conditions, and most include a short mechanism summary and a balanced equation. Every compound shows its structure, IUPAC name and molecular formula.',
  },
  {
    q: 'Does it work on mobile?',
    a: 'Yes. The map supports pinch-to-zoom and touch panning, has a light and dark theme, and can be installed to your home screen as a progressive web app.',
  },
];

const POPULAR = [
  'Aldol Condensation',
  'Cannizzaro Reaction',
  'Reimer-Tiemann Reaction',
  'Hofmann Bromamide Degradation',
  'Friedel-Crafts Acylation',
  'Sandmeyer Reaction',
  'Wurtz Reaction',
  'Clemmensen Reduction',
  'Wolff-Kishner Reduction',
  'Diels-Alder Reaction',
  'Beckmann Rearrangement',
  'Kolbe-Schmitt Reaction',
  'Williamson Ether Synthesis',
  'Carbylamine Reaction (Isocyanide Test)',
  'Gabriel Phthalimide Synthesis (Step 1)',
  'Pinacol-Pinacolone Rearrangement',
];

export const loadDataset = (path) => JSON.parse(readFileSync(path, 'utf8'));

export const buildHomeReplacements = ({ data, siteUrl, appPath = 'app/' }) => {
  const nodesById = new Map(data.nodes.map((node) => [node.id, node]));
  const edges = data.edges.filter(
    (edge) => edge.label && nodesById.has(edge.source) && nodesById.has(edge.target),
  );

  // Group conversions under each reaction name.
  const byLabel = new Map();
  for (const edge of edges) {
    const label = edge.label.trim();
    if (!byLabel.has(label)) byLabel.set(label, []);
    byLabel.get(label).push(edge);
  }
  const labels = [...byLabel.keys()].sort((a, b) =>
    a.localeCompare(b, 'en', { sensitivity: 'base' }),
  );

  const reactionLink = (edge) => `${appPath}?reaction=${encodeURIComponent(edge.id)}`;
  const compoundName = (id) => nodesById.get(id)?.label ?? id;

  // Alphabetical reaction index.
  const letters = new Map();
  for (const label of labels) {
    const first = label[0].toUpperCase();
    const letter = /[A-Z]/.test(first) ? first : '#';
    if (!letters.has(letter)) letters.set(letter, []);
    letters.get(letter).push(label);
  }

  const letterNav = [...letters.keys()]
    .map((letter) => `<a href="#idx-${letter === '#' ? 'other' : letter}">${letter}</a>`)
    .join('');

  const indexHtml = [...letters.entries()]
    .map(([letter, group]) => {
      const items = group
        .map((label) => {
          const conversions = byLabel.get(label);
          const search = [
            label,
            ...conversions.flatMap((edge) => [
              compoundName(edge.source),
              compoundName(edge.target),
              edge.reactionInfo?.reagents ?? '',
            ]),
          ]
            .join(' ')
            .toLowerCase();
          const rows = conversions
            .map((edge) => {
              const reagents = edge.reactionInfo?.reagents
                ? `<span class="rxn-reagents">${escapeHtml(edge.reactionInfo.reagents)}</span>`
                : '';
              return `<li><a href="${reactionLink(edge)}">${escapeHtml(compoundName(edge.source))} <span aria-hidden="true">→</span><span class="sr-only"> to </span> ${escapeHtml(compoundName(edge.target))}</a>${reagents}</li>`;
            })
            .join('');
          return `<article class="rxn" id="rxn-${slugify(label)}" data-search="${escapeHtml(search)}"><h4>${escapeHtml(label)}</h4><ul>${rows}</ul></article>`;
        })
        .join('');
      const id = letter === '#' ? 'other' : letter;
      return `<section class="idx-group" id="idx-${id}" aria-labelledby="idx-h-${id}"><h3 id="idx-h-${id}">${letter}</h3><div class="rxn-grid">${items}</div></section>`;
    })
    .join('');

  // Popular reactions quick links.
  const popularHtml = POPULAR.filter((label) => byLabel.has(label))
    .map((label) => {
      const edge = byLabel.get(label)[0];
      const name = label.replace(/\s*\(Step \d\)$/, '');
      return `<li><a href="${reactionLink(edge)}">${escapeHtml(name)}</a></li>`;
    })
    .join('');

  // Compound classes, case-normalised and sorted by frequency.
  const classes = new Map();
  for (const node of data.nodes) {
    if (!node.type) continue;
    const key = titleCase(node.type);
    classes.set(key, (classes.get(key) ?? 0) + 1);
  }
  const classHtml = [...classes.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(
      ([name, count]) =>
        `<li>${escapeHtml(name)}${count > 1 ? ` <span class="chip-count">${count}</span>` : ''}</li>`,
    )
    .join('');

  const reactionCount = edges.length;
  const namedCount = labels.length;
  const compoundCount = data.nodes.length;
  const classCount = classes.size;

  const appUrl = new URL(appPath, siteUrl).href;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}#website`,
        url: siteUrl,
        name: 'Organic Chemistry Map',
        inLanguage: 'en-IN',
      },
      {
        '@type': ['WebApplication', 'LearningResource'],
        '@id': `${siteUrl}#app`,
        name: 'Organic Chemistry Map',
        url: appUrl,
        description: `Interactive organic chemistry reaction map with ${reactionCount} reactions and ${compoundCount} compounds for JEE Main, JEE Advanced and NEET preparation.`,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Any (web browser)',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
        inLanguage: 'en-IN',
        learningResourceType: ['Concept map', 'Interactive resource'],
        educationalLevel: 'Class 11–12, competitive entrance exams',
        teaches: ['Organic chemistry named reactions', 'Organic conversions', 'Reaction reagents and conditions', 'Reaction mechanisms'],
        about: [
          { '@type': 'Thing', name: 'Organic chemistry' },
          { '@type': 'Thing', name: 'JEE Main' },
          { '@type': 'Thing', name: 'JEE Advanced' },
          { '@type': 'Thing', name: 'NEET' },
        ],
        audience: {
          '@type': 'EducationalAudience',
          educationalRole: 'student',
          audienceType: 'JEE Main, JEE Advanced and NEET aspirants',
        },
        image: new URL('og-image.png', siteUrl).href,
        isPartOf: { '@id': `${siteUrl}#website` },
      },
      {
        '@type': 'FAQPage',
        '@id': `${siteUrl}#faq`,
        mainEntity: FAQ.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
    ],
  };

  const faqHtml = FAQ.map(
    ({ q, a }) => `<details><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`,
  ).join('');

  return {
    '%SITE_URL%': siteUrl,
    '%APP_URL%': appUrl,
    '%REACTION_COUNT%': String(reactionCount),
    '%NAMED_COUNT%': String(namedCount),
    '%COMPOUND_COUNT%': String(compoundCount),
    '%CLASS_COUNT%': String(classCount),
    '<!-- @json-ld -->': `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
    '<!-- @letter-nav -->': letterNav,
    '<!-- @reaction-index -->': indexHtml,
    '<!-- @popular-reactions -->': popularHtml,
    '<!-- @compound-classes -->': classHtml,
    '<!-- @faq -->': faqHtml,
  };
};

export const applyReplacements = (html, replacements) =>
  Object.entries(replacements).reduce((out, [token, value]) => out.split(token).join(value), html);

export const buildSitemap = (siteUrl, appPath = 'app/') => {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: siteUrl, priority: '1.0' },
    { loc: new URL(appPath, siteUrl).href, priority: '0.8' },
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ loc, priority }) =>
      `  <url><loc>${loc}</loc><lastmod>${today}</lastmod><priority>${priority}</priority></url>`,
  )
  .join('\n')}
</urlset>
`;
};
