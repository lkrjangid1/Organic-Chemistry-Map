#!/usr/bin/env node
/**
 * Validates content MDX files before a full build:
 * frontmatter shape, description length, sources, mhchem equations,
 * SMILES (RDKit), map edge ids, related/family slugs, and MDX syntax.
 *
 * Usage: node scripts/validate-content.mjs [file ...]   (default: all content files)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import process from 'node:process';
import YAML from 'yaml';
import katex from 'katex';
import 'katex/contrib/mhchem/mhchem.js';
import { compile } from '@mdx-js/mdx';
import initRDKitModule from '@rdkit/rdkit';

const root = new URL('..', import.meta.url).pathname;
const SECTIONS = ['reactions', 'tests', 'mechanisms', 'concepts', 'comparisons', 'preparation', 'reagents'];
const REACTION_LIKE = new Set(['reactions', 'tests']);
const dirs = Object.fromEntries(SECTIONS.map((s) => [s, join(root, 'src/content', s)]));
const graph = JSON.parse(readFileSync(join(root, 'src/app/data/jee_organic.json'), 'utf8'));
const edgeIds = new Set(graph.edges.map((e) => e.id));
const list = (d) => (existsSync(d) ? readdirSync(d).filter((f) => f.endsWith('.mdx')) : []);
const slugs = Object.fromEntries(SECTIONS.map((s) => [s, new Set(list(dirs[s]).map((f) => basename(f, '.mdx')))]));
const hiDirs = Object.fromEntries(SECTIONS.map((s) => [s, join(root, 'src/content/hi', s)]));
const hiSlugs = Object.fromEntries(SECTIONS.map((s) => [s, new Set(list(hiDirs[s]).map((f) => basename(f, '.mdx')))]));
const mechanismSlugs = slugs.mechanisms;
// Pages planned in this batch may be linked before they exist.
const plannedPath = process.env.PLANNED_SLUGS;
const planned = plannedPath && existsSync(plannedPath) ? new Set(JSON.parse(readFileSync(plannedPath, 'utf8'))) : new Set();
const exists = (section, slug) => slugs[section]?.has(slug) || planned.has(`${section}/${slug}`);
/** related: "section/slug" or a bare slug (reaction or test). */
const relatedOk = (r) => (r.includes('/') ? exists(...r.split('/')) : exists('reactions', r) || exists('tests', r));

const COMPONENTS = new Set(['Eq', 'Mol', 'KeyPoint', 'Trick', 'ExamTip']);
const EXAMS = new Set(['jee-main', 'jee-advanced', 'neet']);
const KINDS = new Set(['named-reaction', 'rearrangement', 'general-reaction', 'test', 'mechanism-type']);
const BANNED = /(byjus|vedantu|toppr|unacademy|physicswallah|pw\.live|allen\.|aakash|careers360|embibe|meritnation|doubtnut|brainly|quora|chegg|testbook|shaalaa|askiitians|sarthaks|reddit|stackexchange|vaia|studysmarter|collegedunia|geeksforgeeks|chemistrylearner|chemistrysteps|masterorganicchemistry)/i;

const rdkit = await initRDKitModule();
const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : SECTIONS.flatMap((s) => [...list(dirs[s]).map((f) => join(dirs[s], f)), ...list(hiDirs[s]).map((f) => join(hiDirs[s], f))]);

let failed = 0;
for (const file of files) {
  const errors = [];
  const warn = [];
  const text = readFileSync(file, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) {
    console.log(`✗ ${file}\n   - missing frontmatter`);
    failed++;
    continue;
  }
  let fm;
  try {
    fm = YAML.parse(m[1]);
  } catch (e) {
    errors.push(`YAML: ${e.message.split('\n')[0]}`);
  }
  const body = m[2];
  const isHindi = file.includes('/content/hi/');
  const section = SECTIONS.find((s) => file.includes(`/content/${s}/`) || file.includes(`/content/hi/${s}/`)) ?? 'reactions';
  const isReaction = !isHindi && REACTION_LIKE.has(section);
  const isTopic = !isHindi && !isReaction && section !== 'mechanisms';
  if (fm) {
    if (!fm.title) errors.push('title missing');
    if (isHindi) {
      if (!slugs[section].has(basename(file, '.mdx'))) errors.push(`no English page ${section}/${basename(file, '.mdx')} for this translation`);
      if (!fm.translated) errors.push('translated date missing');
      if ((fm.faq ?? []).length < 3) warn.push('fewer than 3 FAQ items');
      if (!/[\u0900-\u097F]/.test(m[2])) errors.push('body has no Devanagari text');
    }
    if (!fm.description) errors.push('description missing');
    else if (fm.description.length > (isHindi ? 200 : 160)) errors.push(`description ${fm.description.length} chars (max 160)`);
    else if (fm.description.length < 110) warn.push(`description only ${fm.description.length} chars (aim 130-160)`);
    if (!isHindi && (!Array.isArray(fm.exams) || !fm.exams.length || fm.exams.some((e) => !EXAMS.has(e)))) errors.push('exams must be a non-empty subset of jee-main, jee-advanced, neet');
    const sources = fm.sources ?? [];
    if ((isReaction || isTopic) && sources.length < 2) errors.push('need >= 2 sources');
    if (isTopic) {
      if (!fm.category) errors.push('category missing');
      if (!fm.verified?.status || !fm.verified?.checked) errors.push('verified.status and verified.checked required');
      if (fm.verified && fm.verified.sourceCount !== sources.length) warn.push('verified.sourceCount != number of sources');
      if (fm.family && !exists('mechanisms', fm.family)) errors.push(`unknown family: ${fm.family}`);
      for (const r of fm.related ?? []) if (!r.includes('/') || !relatedOk(r)) errors.push(`related must be an existing "section/slug": ${r}`);
      for (const id of fm.mapEdges ?? []) if (!edgeIds.has(id)) errors.push(`unknown map edge id: ${id}`);
      const smi = fm.molecule?.smiles;
      if (smi) {
        const mol = rdkit.get_mol(smi);
        if (!mol || !mol.is_valid()) errors.push(`molecule.smiles invalid: ${smi}`);
        mol?.delete();
      }
      if ((fm.faq ?? []).length < 3) warn.push('fewer than 3 FAQ items');
    }
    for (const s of sources) {
      if (!s.title || !s.url) errors.push('source needs title and url');
      else if (BANNED.test(s.url)) errors.push(`banned source domain: ${s.url}`);
    }
    if (isReaction) {
      if (!KINDS.has(fm.kind)) errors.push(`kind must be one of ${[...KINDS].join(', ')}`);
      if (!fm.reagents) errors.push('reagents missing');
      if (!fm.verified?.status || !fm.verified?.checked) errors.push('verified.status and verified.checked required');
      if (fm.verified && fm.verified.sourceCount !== sources.length) warn.push('verified.sourceCount != number of sources');
      for (const id of fm.mapEdges ?? []) if (!edgeIds.has(id)) errors.push(`unknown map edge id: ${id}`);
      if (fm.family && !exists('mechanisms', fm.family)) errors.push(`unknown family: ${fm.family}`);
      for (const r of fm.related ?? []) if (!relatedOk(r)) errors.push(`unknown related page: ${r}`);
      for (const key of ['reactant', 'product']) {
        const smi = fm[key]?.smiles;
        if (smi) {
          const mol = rdkit.get_mol(smi);
          if (!mol || !mol.is_valid()) errors.push(`${key}.smiles invalid: ${smi}`);
          mol?.delete();
        }
      }
      if (fm.equation) checkCe(fm.equation, 'frontmatter equation', errors);
      for (const [k, st] of (fm.steps ?? []).entries()) {
        if (!st.title || !st.text) errors.push(`steps[${k}] needs title and text`);
        for (const sp of st.species ?? []) {
          const mol = rdkit.get_mol(sp.smiles ?? '');
          if (!mol || !mol.is_valid()) errors.push(`steps[${k}] invalid SMILES: ${sp.smiles}`);
          else if (sp.highlight) {
            const q = rdkit.get_qmol(sp.highlight);
            if (!q || !q.is_valid()) errors.push(`steps[${k}] invalid highlight SMARTS: ${sp.highlight}`);
            else if (mol.get_substruct_match(q) === '{}') errors.push(`steps[${k}] highlight ${sp.highlight} matches nothing in ${sp.smiles}`);
            q?.delete();
          }
          mol?.delete();
        }
      }
      if ((fm.faq ?? []).length < 3) warn.push('fewer than 3 FAQ items');
    }
  }
  // <Eq ce="..."/> in body
  for (const em of body.matchAll(/<Eq\s+ce=(["'])([\s\S]*?)\1/g)) checkCe(em[2].replace(/\\\\/g, '\\'), 'body <Eq>', errors);
  for (const tag of body.matchAll(/<([A-Z][A-Za-z]*)/g)) if (!COMPONENTS.has(tag[1])) errors.push(`unknown component <${tag[1]}>`);
  for (const link of body.matchAll(/\]\(\/hi\/([a-z]+)\/([a-z0-9-]+)\/?(#[a-z0-9-]*)?\)/g)) {
    if (!hiSlugs[link[1]]?.has(link[2]) && !planned.has(`hi/${link[1]}/${link[2]}`)) errors.push(`link to missing Hindi page /hi/${link[1]}/${link[2]}/`);
  }
  for (const link of body.matchAll(/\]\(\/([a-z]+)\/([a-z0-9-]+)\/?(#[a-z0-9-]*)?\)/g)) {
    if (link[1] === 'compounds' || link[1] === 'map' || link[1] === 'hi') continue;
    if (!SECTIONS.includes(link[1])) errors.push(`link to unknown section /${link[1]}/`);
    else if (!exists(link[1], link[2])) errors.push(`link to unknown page /${link[1]}/${link[2]}/`);
  }
  if (/^#\s/m.test(body)) errors.push('do not use a level-1 heading (# ...) in the body; the page title is the H1');
  const words = body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  if ((isReaction || isTopic) && words < 350) warn.push(`body only ${words} words (aim 500-900)`);
  try {
    await compile(body);
  } catch (e) {
    errors.push(`MDX: ${String(e.message).split('\n')[0]}`);
  }
  if (errors.length) failed++;
  console.log(`${errors.length ? '✗' : '✓'} ${file.replace(root, '')}${words ? ` (${words} words)` : ''}`);
  for (const e of errors) console.log(`   ERROR ${e}`);
  for (const w of warn) console.log(`   warn  ${w}`);
}
process.exit(failed ? 1 : 0);

function checkCe(ce, where, errors) {
  try {
    katex.renderToString(`\\ce{${ce}}`, { throwOnError: true, strict: 'ignore' });
  } catch (e) {
    errors.push(`${where} mhchem error: ${String(e.message).slice(0, 120)} :: ${ce.slice(0, 80)}`);
  }
}
