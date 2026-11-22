/**
 * Content sections (collections) and how they appear on the site.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { url } from './site';

export const SECTIONS = {
  reactions: { label: 'Reactions', singular: 'Reaction', path: 'reactions/' },
  tests: { label: 'Tests', singular: 'Test', path: 'tests/' },
  mechanisms: { label: 'Mechanisms', singular: 'Mechanism', path: 'mechanisms/' },
  concepts: { label: 'Concepts', singular: 'Concept', path: 'concepts/' },
  comparisons: { label: 'Comparisons', singular: 'Comparison', path: 'comparisons/' },
  preparation: { label: 'Preparation', singular: 'Preparation method', path: 'preparation/' },
  reagents: { label: 'Reagents', singular: 'Reagent', path: 'reagents/' },
} as const;

export type SectionKey = keyof typeof SECTIONS;
export type TopicKey = 'concepts' | 'comparisons' | 'preparation' | 'reagents';
export type ReactionKey = 'reactions' | 'tests';

export interface PageRef {
  section: SectionKey;
  id: string;
  title: string;
  description: string;
  href: string;
  path: string;
}

let cache: Map<string, PageRef> | undefined;

/** Every content page keyed by "section/slug". */
export async function allPages(): Promise<Map<string, PageRef>> {
  if (cache) return cache;
  const map = new Map<string, PageRef>();
  for (const section of Object.keys(SECTIONS) as SectionKey[]) {
    const entries = (await getCollection(section)) as CollectionEntry<SectionKey>[];
    for (const e of entries) {
      const path = `${SECTIONS[section].path}${e.id}/`;
      map.set(`${section}/${e.id}`, { section, id: e.id, title: e.data.title, description: e.data.description, href: url(path), path });
    }
  }
  cache = map;
  return map;
}

/** Resolves related entries: "collection/slug" paths, or bare slugs (looked up in `fallback` first, then reactions, then tests). */
export async function resolveRelated(list: string[], fallback: SectionKey = 'reactions'): Promise<PageRef[]> {
  const pages = await allPages();
  const out: PageRef[] = [];
  for (const item of list) {
    const ref = item.includes('/')
      ? pages.get(item)
      : pages.get(`${fallback}/${item}`) ?? pages.get(`reactions/${item}`) ?? pages.get(`tests/${item}`);
    if (ref && !out.includes(ref)) out.push(ref);
  }
  return out;
}

/** Pages of any section that belong to a mechanisms/ hub. */
export async function familyMembers(hub: string): Promise<PageRef[]> {
  const pages = await allPages();
  const out: PageRef[] = [];
  for (const section of ['reactions', 'tests', 'reagents', 'concepts', 'comparisons', 'preparation'] as const) {
    for (const e of await getCollection(section)) {
      if ((e.data as { family?: string }).family === hub) out.push(pages.get(`${section}/${e.id}`)!);
    }
  }
  return out.sort((a, b) => a.title.localeCompare(b.title));
}
