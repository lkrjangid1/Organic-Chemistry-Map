/**
 * Original practice questions, one JSON file per page:
 * src/data/practice/<section>/<slug>.json → { page, questions: [{ q, options, answer, explain, smiles? }] }
 */
export interface PracticeQuestion { q: string; options: string[]; answer: number; explain: string; smiles?: string }
interface PracticeFile { page: string; questions: PracticeQuestion[] }

const files = import.meta.glob<PracticeFile>('../data/practice/*/*.json', { eager: true, import: 'default' });
const byPage = new Map(Object.values(files).map((f) => [f.page, f.questions]));

export const practiceFor = (ref: string): PracticeQuestion[] => byPage.get(ref) ?? [];
export const allPractice = () => [...byPage.entries()].flatMap(([page, qs]) => qs.map((q, i) => ({ page, i, ...q })));
