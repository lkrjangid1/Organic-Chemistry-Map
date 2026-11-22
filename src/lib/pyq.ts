/**
 * Previous-year questions (PYQs) from official papers, stored as JSON in src/data/pyq/.
 * One file per paper: <exam>-<year>-p<paper>.json.
 */
import { url } from './site';

export interface PyqFigure { smiles: string; label?: string }
export interface PyqOption { key: string; text?: string; smiles?: string }
export interface PyqQuestion {
  id: string;
  number: number;
  type: 'single' | 'multiple' | 'numerical' | 'matching' | 'paragraph';
  /** Shared passage for paragraph-based questions. */
  passage?: string;
  stem: string;
  figures?: PyqFigure[];
  options?: PyqOption[];
  /** "B", ["A","C"], "6" or "2.5-2.7" */
  answer: string | string[];
  /** Original worked solution written for this site. */
  solution: string;
  /** "section/slug" pages this question tests. */
  topics: string[];
  check: { solutions: number; agree: boolean; note?: string };
}
export interface PyqPaper {
  exam: 'jee-advanced';
  year: number;
  paper: number;
  source: string;
  questions: PyqQuestion[];
}

const files = import.meta.glob<PyqPaper>('../data/pyq/*.json', { eager: true, import: 'default' });

export const EXAM_NAME = { 'jee-advanced': 'JEE Advanced' } as const;

export const papers: PyqPaper[] = Object.values(files)
  .map((p) => ({ ...p, questions: p.questions.filter((q) => q.check?.agree) }))
  .filter((p) => p.questions.length)
  .sort((a, b) => b.year - a.year || a.paper - b.paper);

export const paperSlug = (p: PyqPaper) => `${p.exam}-${p.year}-paper-${p.paper}`;
export const paperTitle = (p: PyqPaper) => `${EXAM_NAME[p.exam]} ${p.year} Paper ${p.paper}`;
export const questionHref = (p: PyqPaper, q: PyqQuestion) => url(`pyq/${paperSlug(p)}/#q${q.number}`);

/** Questions that test a page, newest first. */
export function questionsFor(ref: string) {
  const out: { paper: PyqPaper; q: PyqQuestion }[] = [];
  for (const paper of papers) for (const q of paper.questions) if (q.topics.includes(ref)) out.push({ paper, q });
  return out;
}

export const answerText = (a: string | string[]) => (Array.isArray(a) ? a.join(', ') : a);
