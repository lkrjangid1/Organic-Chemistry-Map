#!/usr/bin/env node
/**
 * Validates previous-year question files in src/data/pyq/: shape, answer format,
 * SMILES (RDKit) and topic links.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import initRDKitModule from '@rdkit/rdkit';

const root = new URL('..', import.meta.url).pathname;
const dir = join(root, 'src/data/pyq');
const files = process.argv.slice(2).length ? process.argv.slice(2) : existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => join(dir, f)) : [];
const rdkit = await initRDKitModule();
const TYPES = new Set(['single', 'multiple', 'numerical', 'matching', 'paragraph']);
const pageExists = (ref) => existsSync(join(root, 'src/content', `${ref}.mdx`));
const smilesOk = (s) => { const m = rdkit.get_mol(s); const ok = !!m && m.is_valid(); m?.delete(); return ok; };
let failed = 0;
for (const file of files) {
  const errors = [];
  let d;
  try { d = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { console.log(`✗ ${file}\n   ERROR JSON: ${e.message}`); failed++; continue; }
  if (d.exam !== 'jee-advanced') errors.push('exam must be jee-advanced');
  if (!Number.isInteger(d.year) || !Number.isInteger(d.paper)) errors.push('year and paper must be integers');
  if (!/^https:\/\/jeeadv\.ac\.in\//.test(d.source ?? '')) errors.push('source must be the official jeeadv.ac.in PDF');
  const seen = new Set();
  for (const q of d.questions ?? []) {
    const at = `Q${q.number}`;
    if (seen.has(q.number)) errors.push(`${at}: duplicate number`);
    seen.add(q.number);
    if (q.id !== `${d.exam}-${d.year}-p${d.paper}-q${q.number}`) errors.push(`${at}: id must be ${d.exam}-${d.year}-p${d.paper}-q${q.number}`);
    if (!TYPES.has(q.type)) errors.push(`${at}: bad type ${q.type}`);
    if (!q.stem || !q.solution) errors.push(`${at}: stem and solution required`);
    const keys = (q.options ?? []).map((o) => o.key);
    const ans = Array.isArray(q.answer) ? q.answer : [q.answer];
    if (q.type === 'numerical') { if (!/^-?\d+(\.\d+)?(\s*-\s*-?\d+(\.\d+)?)?$/.test(String(q.answer))) errors.push(`${at}: numerical answer must be a number or range`); }
    else if (!ans.length || ans.some((a) => !keys.includes(a))) errors.push(`${at}: answer ${JSON.stringify(q.answer)} not among option keys ${keys.join(',')}`);
    if (q.type === 'single' && ans.length !== 1) errors.push(`${at}: single-correct needs one answer`);
    for (const f of q.figures ?? []) if (!smilesOk(f.smiles)) errors.push(`${at}: invalid figure SMILES ${f.smiles}`);
    for (const o of q.options ?? []) if (o.smiles && !smilesOk(o.smiles)) errors.push(`${at}: invalid option SMILES ${o.smiles}`);
    for (const o of q.options ?? []) if (!o.text && !o.smiles) errors.push(`${at}: option ${o.key} needs text or smiles`);
    if (!(q.topics ?? []).length) errors.push(`${at}: at least one topic`);
    for (const t of q.topics ?? []) if (!pageExists(t)) errors.push(`${at}: topic page missing: ${t}`);
    if (typeof q.check?.solutions !== 'number' || typeof q.check?.agree !== 'boolean') errors.push(`${at}: check {solutions, agree} required`);
  }
  if (errors.length) failed++;
  console.log(`${errors.length ? '✗' : '✓'} ${file.replace(root, '')} (${(d.questions ?? []).length} questions)`);
  for (const e of errors) console.log(`   ERROR ${e}`);
}
process.exit(failed ? 1 : 0);
