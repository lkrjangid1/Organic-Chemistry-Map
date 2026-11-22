#!/usr/bin/env node
/** Validates practice-question files in src/data/practice/<section>/<slug>.json. */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import process from 'node:process';
import initRDKitModule from '@rdkit/rdkit';

const root = new URL('..', import.meta.url).pathname;
const dir = join(root, 'src/data/practice');
const all = existsSync(dir) ? readdirSync(dir).filter((s) => statSync(join(dir, s)).isDirectory()).flatMap((s) => readdirSync(join(dir, s)).filter((f) => f.endsWith('.json')).map((f) => join(dir, s, f))) : [];
const files = process.argv.slice(2).length ? process.argv.slice(2) : all;
const rdkit = await initRDKitModule();
let failed = 0;
let total = 0;
for (const file of files) {
  const errors = [];
  let d;
  try { d = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { console.log(`✗ ${file}\n   ERROR JSON: ${e.message}`); failed++; continue; }
  const section = file.split('/').at(-2);
  const slug = basename(file, '.json');
  if (d.page !== `${section}/${slug}`) errors.push(`page must be "${section}/${slug}"`);
  if (!existsSync(join(root, 'src/content', section, `${slug}.mdx`))) errors.push(`no page src/content/${section}/${slug}.mdx`);
  const qs = d.questions ?? [];
  if (qs.length < 3 || qs.length > 6) errors.push(`3–6 questions expected, found ${qs.length}`);
  qs.forEach((q, i) => {
    if (!q.q || !q.explain) errors.push(`q${i + 1}: q and explain required`);
    if (!Array.isArray(q.options) || q.options.length !== 4) errors.push(`q${i + 1}: exactly 4 options`);
    else if (new Set(q.options.map((o) => o.trim().toLowerCase())).size !== 4) errors.push(`q${i + 1}: duplicate options`);
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) errors.push(`q${i + 1}: answer must be 0–3`);
    if (q.smiles) { const m = rdkit.get_mol(q.smiles); if (!m || !m.is_valid()) errors.push(`q${i + 1}: invalid SMILES`); m?.delete(); }
  });
  total += qs.length;
  if (errors.length) failed++;
  console.log(`${errors.length ? '✗' : '✓'} ${file.replace(root, '')} (${qs.length})`);
  for (const e of errors) console.log(`   ERROR ${e}`);
}
console.log(`${files.length} files, ${total} questions`);
process.exit(failed ? 1 : 0);
