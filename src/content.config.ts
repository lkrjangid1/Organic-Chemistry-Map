import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const exam = z.enum(['jee-main', 'jee-advanced', 'neet']);

const source = z.object({
  title: z.string(),
  url: z.string().url(),
  publisher: z.string().optional(),
});

const molecule = z.object({
  name: z.string(),
  smiles: z.string().optional(),
});

const faq = z.object({ q: z.string(), a: z.string() });

const trick = z.object({
  text: z.string(),
  meaning: z.string().optional(),
});

const verified = z.object({
  status: z.enum(['verified', 'conflict', 'pending']),
  checked: z.coerce.date(),
  sourceCount: z.number().int().min(0),
  note: z.string().optional(),
});

/** Shared shape of reaction and test pages. */
const reactionSchema = z.object({
  title: z.string(),
  /** <= 160 chars, answer-first; used as meta description. */
  description: z.string().max(170),
  aliases: z.array(z.string()).default([]),
  kind: z.enum(['named-reaction', 'rearrangement', 'general-reaction', 'test', 'mechanism-type']),
  /** Slug of a mechanisms/ hub page. */
  family: z.string().optional(),
  exams: z.array(exam).min(1),
  /** Edge ids in src/app/data/jee_organic.json shown on the map. */
  mapEdges: z.array(z.string()).default([]),
  reactant: molecule.optional(),
  product: molecule.optional(),
  byproducts: z.string().optional(),
  reagents: z.string(),
  conditions: z.string().optional(),
  /** mhchem expression without \ce{}, e.g. "2 C6H5CHO ->[conc. NaOH] C6H5CH2OH + C6H5COONa" */
  equation: z.string().optional(),
  /** Tests only: what a positive result looks like. */
  observation: z.string().optional(),
  /** Tests only: what the test tells apart, e.g. "1°, 2° and 3° alcohols". */
  distinguishes: z.string().optional(),
  notesPages: z.array(z.number()).default([]),
  /** Step-by-step mechanism shown as an interactive stepper. */
  steps: z
    .array(
      z.object({
        title: z.string(),
        text: z.string(),
        /** Species drawn for this step (left to right). */
        species: z.array(z.object({ smiles: z.string(), label: z.string().optional(), highlight: z.string().optional() })).default([]),
        /** Short description of the electron movement (curly arrows). */
        arrows: z.string().optional(),
      }),
    )
    .default([]),
  memoryTricks: z.array(trick).default([]),
  faq: z.array(faq).default([]),
  /** Bare slugs of reaction pages, or "collection/slug" paths to other pages. */
  related: z.array(z.string()).default([]),
  sources: z.array(source).min(2),
  verified,
});

/** One page per reaction (named reaction, rearrangement, general reaction). */
const reactions = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/reactions' }),
  schema: reactionSchema,
});

/** One page per laboratory test (Tollens, Fehling, Lucas, Hinsberg...). */
const tests = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/tests' }),
  schema: reactionSchema,
});

/** Shared shape of concept, comparison, preparation and reagent pages. */
const topicSchema = z.object({
  title: z.string(),
  description: z.string().max(170),
  aliases: z.array(z.string()).default([]),
  /** Grouping on the index page, e.g. "General organic chemistry". */
  category: z.string(),
  exams: z.array(exam).min(1),
  /** Reagents: formula shown in the header, e.g. "LiAlH₄". */
  formula: z.string().optional(),
  /** Optional structure drawn at the top of the page. */
  molecule: molecule.optional(),
  /** Slug of a mechanisms/ hub page. */
  family: z.string().optional(),
  notesPages: z.array(z.number()).default([]),
  memoryTricks: z.array(trick).default([]),
  faq: z.array(faq).default([]),
  /** "collection/slug" paths, e.g. "reactions/rosenmund-reduction". */
  related: z.array(z.string()).default([]),
  sources: z.array(source).min(2),
  verified,
});

const topic = (dir: string) =>
  defineCollection({ loader: glob({ pattern: '**/*.mdx', base: `./src/content/${dir}` }), schema: topicSchema });

const concepts = topic('concepts');
const comparisons = topic('comparisons');
const preparation = topic('preparation');
const reagents = topic('reagents');

/** Hub pages that group reaction families (e.g. nucleophilic substitution). */
const mechanisms = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/mechanisms' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(170),
    exams: z.array(exam).min(1),
    order: z.number().default(100),
    notesPages: z.array(z.number()).default([]),
    faq: z.array(faq).default([]),
    sources: z.array(source).default([]),
    verified: z
      .object({
        status: z.enum(['verified', 'conflict', 'pending']),
        checked: z.coerce.date(),
        sourceCount: z.number().int().min(0),
      })
      .optional(),
  }),
});

/**
 * Hindi translations (Devanagari, English technical terms). File path mirrors the
 * English page: src/content/hi/reactions/aldol-condensation.mdx translates
 * reactions/aldol-condensation. Structured data (structures, sources, map links)
 * comes from the English page; these fields override its text.
 */
const hindi = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/hi' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(200),
    aliases: z.array(z.string()).default([]),
    reagents: z.string().optional(),
    conditions: z.string().optional(),
    byproducts: z.string().optional(),
    observation: z.string().optional(),
    distinguishes: z.string().optional(),
    reactantName: z.string().optional(),
    productName: z.string().optional(),
    memoryTricks: z.array(trick).optional(),
    /** Translated mechanism steps, matched to the English steps by position. */
    steps: z.array(z.object({ title: z.string(), text: z.string(), arrows: z.string().optional() })).optional(),
    faq: z.array(faq).default([]),
    /** Date the translation was last brought in line with the English page. */
    translated: z.coerce.date(),
  }),
});

export const collections = {
  hindi, reactions, tests, mechanisms, concepts, comparisons, preparation, reagents };
