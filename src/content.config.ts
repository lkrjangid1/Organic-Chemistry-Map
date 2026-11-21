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

/** One page per reaction (named reaction, rearrangement, test, general reaction). */
const reactions = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/reactions' }),
  schema: z.object({
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
    notesPages: z.array(z.number()).default([]),
    memoryTricks: z.array(trick).default([]),
    faq: z.array(faq).default([]),
    related: z.array(z.string()).default([]),
    sources: z.array(source).min(2),
    verified: z.object({
      status: z.enum(['verified', 'conflict', 'pending']),
      checked: z.coerce.date(),
      sourceCount: z.number().int().min(0),
      note: z.string().optional(),
    }),
  }),
});

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

export const collections = { reactions, mechanisms };
