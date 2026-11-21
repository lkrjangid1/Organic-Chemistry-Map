/**
 * The master reaction list: every reaction page plus every map reaction that
 * does not have a page yet (those link to the map until their batch is written).
 */
import { getCollection } from 'astro:content';
import { edges, edgesById, compoundName, type GraphEdge } from './graph';

export interface MasterItem {
  title: string;
  slug?: string;
  description?: string;
  conversions: { edge: GraphEdge; label: string }[];
  search: string;
}

export async function getMasterList(): Promise<MasterItem[]> {
  const pages = await getCollection('reactions');
  const covered = new Set(pages.flatMap((p) => p.data.mapEdges));
  const items: MasterItem[] = pages.map((p) => {
    const conv = p.data.mapEdges
      .map((id) => edgesById.get(id))
      .filter((e): e is GraphEdge => !!e)
      .map((edge) => ({ edge, label: `${compoundName(edge.source)} → ${compoundName(edge.target)}` }));
    return {
      title: p.data.title,
      slug: p.id,
      description: p.data.description,
      conversions: conv,
      search: [p.data.title, ...p.data.aliases, p.data.reagents, ...conv.map((c) => c.label)].join(' ').toLowerCase(),
    };
  });

  const byLabel = new Map<string, GraphEdge[]>();
  for (const e of edges) {
    if (covered.has(e.id)) continue;
    const label = e.label.trim();
    byLabel.set(label, [...(byLabel.get(label) ?? []), e]);
  }
  for (const [label, list] of byLabel) {
    const conv = list.map((edge) => ({ edge, label: `${compoundName(edge.source)} → ${compoundName(edge.target)}` }));
    items.push({
      title: label,
      conversions: conv,
      search: [label, ...list.map((e) => e.reactionInfo?.reagents ?? ''), ...conv.map((c) => c.label)].join(' ').toLowerCase(),
    });
  }
  return items.sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }));
}
