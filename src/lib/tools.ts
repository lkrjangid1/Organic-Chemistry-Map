/**
 * Build-time data for the study tools (path finder, reagent finder, flashcards, quiz).
 * Everything comes from the site's own pages, the conversion graph and the map data.
 */
import { createHash } from 'node:crypto';
import { getCollection } from 'astro:content';
import conversions from '../data/conversions.json';
import { edges, nodes, nodesById, compoundName } from './graph';
import { url } from './site';
import { SECTIONS, type SectionKey } from './sections';
import { allPractice } from './practice';

export interface Group { id: string; name: string; formula?: string; page?: string }
export interface Step { from: string; to: string; reagents: string; conditions?: string; name: string; page: string; note?: string }
export const groups = conversions.groups as Group[];
export const steps = conversions.steps as Step[];

/** "section/slug" → site href. */
export const pageHref = (ref: string) => {
  const [section, slug] = ref.split('/');
  return url(`${SECTIONS[section as SectionKey]?.path ?? `${section}/`}${slug}/`);
};

/** Stable file name for a structure SVG. */
export const molKey = (smiles: string) => createHash('sha1').update(smiles).digest('hex').slice(0, 12);
export const molUrl = (smiles: string) => url(`structures/${molKey(smiles)}.svg`);

const reactionLike = async () => [...(await getCollection('reactions')), ...(await getCollection('tests'))];

/** Every SMILES drawn by the tools (reaction/test examples and practice questions). */
export async function toolSmiles(): Promise<string[]> {
  const set = new Set<string>();
  for (const p of allPractice()) if (p.smiles) set.add(p.smiles);
  for (const e of await reactionLike()) {
    if (e.data.reactant?.smiles) set.add(e.data.reactant.smiles);
    if (e.data.product?.smiles) set.add(e.data.product.smiles);
  }
  return [...set];
}

/** Map edge id → page path, for edges covered by a reaction page. */
async function pageForEdge(): Promise<Map<string, { title: string; href: string }>> {
  const m = new Map<string, { title: string; href: string }>();
  for (const e of await reactionLike()) for (const id of e.data.mapEdges) m.set(id, { title: e.data.title, href: url(`${e.collection}/${e.id}/`) });
  return m;
}

/** Data for the path finder: functional groups and map compounds. */
export async function pathFinderData() {
  const pages = await pageForEdge();
  return {
    groups: groups.map((g) => ({ id: g.id, name: g.name, formula: g.formula ?? '' })),
    groupSteps: steps.map((s) => ({ f: s.from, t: s.to, r: s.reagents, c: s.conditions ?? '', n: s.name, h: pageHref(s.page), note: s.note ?? '' })),
    compounds: nodes.map((n) => ({ id: n.id, name: n.label })),
    compoundSteps: edges.map((e) => ({
      f: e.source,
      t: e.target,
      r: e.reactionInfo?.reagents ?? '',
      c: e.reactionInfo?.conditions ?? '',
      n: e.label,
      h: pages.get(e.id)?.href ?? url(`map/?reaction=${encodeURIComponent(e.id)}`),
      note: '',
    })),
  };
}

/** Search index for the reagent finder. */
export async function reagentIndex() {
  const out: { r: string; what: string; conv: string; href: string; kind: string; extra: string }[] = [];
  for (const g of await getCollection('reagents')) {
    out.push({ r: g.data.formula ?? g.data.title, what: g.data.title, conv: g.data.description, href: url(`reagents/${g.id}/`), kind: 'Reagent page', extra: g.data.aliases.join(' ') });
  }
  const groupName = new Map(groups.map((g) => [g.id, g.name]));
  for (const s of steps) {
    out.push({ r: s.reagents, what: s.name, conv: `${groupName.get(s.from)} → ${groupName.get(s.to)}${s.note ? ` (${s.note})` : ''}`, href: pageHref(s.page), kind: 'Conversion', extra: s.conditions ?? '' });
  }
  for (const e of await reactionLike()) {
    const conv = e.data.reactant && e.data.product ? `${e.data.reactant.name} → ${e.data.product.name}` : e.data.description;
    out.push({ r: e.data.reagents, what: e.data.title, conv, href: url(`${e.collection}/${e.id}/`), kind: e.collection === 'tests' ? 'Test' : 'Reaction page', extra: e.data.aliases.join(' ') });
  }
  const covered = new Set((await reactionLike()).flatMap((e) => e.data.mapEdges));
  for (const e of edges) {
    if (covered.has(e.id) || !e.reactionInfo?.reagents) continue;
    out.push({ r: e.reactionInfo.reagents, what: e.label, conv: `${compoundName(e.source)} → ${compoundName(e.target)}`, href: url(`map/?reaction=${encodeURIComponent(e.id)}`), kind: 'Map reaction', extra: '' });
  }
  return out;
}

export interface Card { id: string; deck: string; front: string; sub?: string; back: string[]; href: string }

/** Flashcards from every section. */
export async function flashcards(): Promise<Card[]> {
  const cards: Card[] = [];
  for (const e of await getCollection('reactions')) {
    const d = e.data;
    const href = url(`reactions/${e.id}/`);
    const conv = d.reactant && d.product ? `${d.reactant.name} → ${d.product.name}` : '';
    cards.push({ id: `r:${e.id}`, deck: 'reactions', front: d.title, back: [`Reagents: ${d.reagents}`, ...(d.conditions ? [`Conditions: ${d.conditions}`] : []), ...(conv ? [`Example: ${conv}`] : [])], href });
    if (d.reactant && d.product) {
      cards.push({ id: `x:${e.id}`, deck: 'reverse', front: `${d.reactant.name} + ${d.reagents}`, sub: 'Name the reaction and the product', back: [`${d.title}`, `Product: ${d.product.name}`], href });
    }
  }
  for (const e of await getCollection('tests')) {
    const d = e.data;
    cards.push({ id: `t:${e.id}`, deck: 'tests', front: d.title, back: [`Reagent: ${d.reagents}`, ...(d.observation ? [`Positive result: ${d.observation}`] : []), ...(d.distinguishes ? [`Distinguishes: ${d.distinguishes}`] : [])], href: url(`tests/${e.id}/`) });
  }
  for (const e of await getCollection('reagents')) {
    cards.push({ id: `g:${e.id}`, deck: 'reagents', front: e.data.formula && e.data.formula !== e.data.title ? `${e.data.title}` : e.data.title, sub: 'What does it do?', back: [e.data.description], href: url(`reagents/${e.id}/`) });
  }
  for (const e of await getCollection('comparisons')) {
    cards.push({ id: `c:${e.id}`, deck: 'theory', front: e.data.title, back: [e.data.description], href: url(`comparisons/${e.id}/`) });
  }
  for (const e of await getCollection('concepts')) {
    cards.push({ id: `k:${e.id}`, deck: 'theory', front: e.data.title, back: [e.data.description], href: url(`concepts/${e.id}/`) });
  }
  return cards;
}

const shuffle = <T,>(a: T[], seed: number) => {
  const arr = [...a];
  let x = seed || 1;
  for (let i = arr.length - 1; i > 0; i--) {
    x = (x * 1103515245 + 12345) % 2147483648;
    const j = x % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/** Predict-the-product questions: structure questions from reaction pages, name questions from the conversion graph. */
export async function quizQuestions() {
  const qs: Record<string, unknown>[] = [];
  const pages = (await reactionLike()).filter((e) => e.data.reactant?.smiles && e.data.product?.smiles && e.data.reactant.smiles !== e.data.product.smiles && e.data.verified.status !== 'pending');
  pages.forEach((e, i) => {
    const d = e.data;
    const pool = pages.filter((o) => o.id !== e.id && o.data.product!.smiles !== d.product!.smiles && o.data.product!.smiles !== d.reactant!.smiles);
    const same = pool.filter((o) => o.data.family && o.data.family === d.family);
    const picks: typeof pages = [];
    for (const o of [...shuffle(same, i + 7), ...shuffle(pool, i + 13)]) {
      if (picks.length >= 3) break;
      if (!picks.some((p) => p.data.product!.smiles === o.data.product!.smiles)) picks.push(o);
    }
    const options = shuffle([{ name: d.product!.name, svg: molUrl(d.product!.smiles!), ok: true }, ...picks.map((p) => ({ name: p.data.product!.name, svg: molUrl(p.data.product!.smiles!), ok: false }))], i + 3);
    qs.push({ type: 'structure', reactant: { name: d.reactant!.name, svg: molUrl(d.reactant!.smiles!) }, reagents: d.reagents, options: options.map(({ name, svg }) => ({ name, svg })), answer: options.findIndex((o) => o.ok), title: d.title, href: url(`${e.collection}/${e.id}/`) });
  });
  const groupName = new Map(groups.map((g) => [g.id, g.name]));
  steps.forEach((s, i) => {
    // Avoid distractors that are also correct for the same start + reagents.
    const valid = new Set(steps.filter((o) => o.from === s.from && o.reagents === s.reagents).map((o) => o.to));
    const near = [...new Set(steps.filter((o) => o.from === s.from && !valid.has(o.to)).map((o) => o.to))];
    const rest = groups.map((g) => g.id).filter((id) => id !== s.from && !valid.has(id) && !near.includes(id));
    const distract = [...shuffle(near, i + 5), ...shuffle(rest, i + 11)].slice(0, 3);
    if (distract.length < 3) return;
    const options = shuffle([s.to, ...distract], i + 17);
    qs.push({ type: 'group', from: groupName.get(s.from), reagents: s.reagents, conditions: s.conditions ?? '', options: options.map((id) => groupName.get(id)), answer: options.indexOf(s.to), title: s.name, note: s.note ?? '', href: pageHref(s.page) });
  });
  const titles = new Map<string, string>();
  for (const section of ['reactions', 'tests', 'reagents', 'concepts', 'comparisons'] as const) {
    for (const e of await getCollection(section)) titles.set(`${section}/${e.id}`, e.data.title);
  }
  for (const p of allPractice()) {
    qs.push({ type: 'mcq', stem: p.q, svg: p.smiles ? molUrl(p.smiles) : '', options: p.options, answer: p.answer, title: titles.get(p.page) ?? p.page, note: p.explain, href: pageHref(p.page) });
  }
  return qs;
}

export { nodesById };
