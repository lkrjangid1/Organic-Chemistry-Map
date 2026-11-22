/**
 * Links between the interactive map and the site's pages, in both directions.
 */
import { getCollection } from 'astro:content';
import { url } from './site';
import { edgesById, compoundSlug, pageCompounds, type GraphEdge } from './graph';
import type { MapLinks, PageLink } from '../app/data/PageLinks';

let edgeCache: Map<string, PageLink[]> | undefined;

/** Sections whose pages list the map edges they explain (reaction pages first). */
const MAP_SECTIONS = ['reactions', 'tests', 'reagents', 'preparation', 'concepts'] as const;

/** Map edge id → pages that cover it. */
export async function edgePages(): Promise<Map<string, PageLink[]>> {
  if (edgeCache) return edgeCache;
  const m = new Map<string, PageLink[]>();
  for (const section of MAP_SECTIONS) {
    for (const e of await getCollection(section)) {
      const link = { t: e.data.title, h: url(`${section}/${e.id}/`) };
      for (const id of e.data.mapEdges) {
        const list = m.get(id) ?? [];
        if (!list.some((l) => l.h === link.h)) list.push(link);
        m.set(id, list);
      }
    }
  }
  edgeCache = m;
  return m;
}

/** Everything the map needs to link back to the site. */
export async function mapLinks(): Promise<MapLinks> {
  return {
    edges: Object.fromEntries(await edgePages()),
    compounds: Object.fromEntries(pageCompounds.map((n) => [n.id, { t: n.label, h: url(`compounds/${compoundSlug(n.id)}/`) }])),
  };
}

/** Map conversions covered by the given pages, one per source → target pair. */
export async function conversionsFor(refs: { section: string; id: string }[], limit = 10): Promise<GraphEdge[]> {
  const entries = new Map<string, string[]>();
  for (const section of MAP_SECTIONS) {
    for (const e of await getCollection(section)) entries.set(`${section}/${e.id}`, e.data.mapEdges);
  }
  const out: GraphEdge[] = [];
  for (const r of refs) {
    for (const id of entries.get(`${r.section}/${r.id}`) ?? []) {
      const e = edgesById.get(id);
      if (e && !out.some((o) => o.source === e.source && o.target === e.target)) out.push(e);
      if (out.length >= limit) return out;
    }
  }
  return out;
}
