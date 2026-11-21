/**
 * Read-only helpers over the master reaction graph (the same JSON the map uses).
 */
import raw from '../app/data/jee_organic.json';

export interface GraphNode {
  id: string;
  label: string;
  smiles?: string;
  type?: string;
  info?: { iupac?: string; formula?: string; notes?: string; properties?: string };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  reactionInfo?: {
    reagents?: string;
    conditions?: string;
    mechanism?: string;
    equation?: string;
    importance?: string;
  };
}

const data = raw as unknown as { nodes: GraphNode[]; edges: GraphEdge[] };

export const nodes = data.nodes;
export const nodesById = new Map(nodes.map((n) => [n.id, n]));

/** Edges whose endpoints both exist (the dataset has a few dangling ones). */
export const edges = data.edges.filter(
  (e) => e.label && nodesById.has(e.source) && nodesById.has(e.target),
);
export const edgesById = new Map(edges.map((e) => [e.id, e]));

export const slugify = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const compoundSlug = (id: string) => slugify(id.replace(/_/g, '-'));

export const titleCase = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .map((w) => (/^[a-z]/.test(w) ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');

const degree = new Map<string, number>();
for (const e of edges) {
  degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
  degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
}

/** Compounds that earn their own page: in >= 3 reactions (decision Q28). */
export const COMPOUND_PAGE_MIN_REACTIONS = 3;
export const pageCompounds = nodes.filter(
  (n) => (degree.get(n.id) ?? 0) >= COMPOUND_PAGE_MIN_REACTIONS,
);
export const hasCompoundPage = new Set(pageCompounds.map((n) => n.id));

export const edgesFrom = (id: string) => edges.filter((e) => e.source === id);
export const edgesTo = (id: string) => edges.filter((e) => e.target === id);
export const compoundName = (id: string) => nodesById.get(id)?.label ?? id;
