import { z } from "zod";

/** Which fighter a value points at. */
export const sideSchema = z.enum(["a", "b"]);
export const outcomeSchema = z.enum(["a", "b", "draw"]);

export type Side = z.infer<typeof sideSchema>;
export type Outcome = z.infer<typeof outcomeSchema>;

const probabilitiesSchema = z.record(z.string(), z.number());

export const dimensionVerdictSchema = z.object({
  key: z.string(),
  label: z.string(),
  weight: z.number(),
  /** Raw rubric position, 0..6. */
  score: z.number(),
  /** Normalized to [-1, 1]; positive favours fighter_a. */
  signed: z.number(),
  confidence: z.number(),
  probabilities: probabilitiesSchema,
  legend: z.record(z.string(), z.string()),
});

export const verdictSchema = z.object({
  model: z.string(),
  winner: z.object({
    side: outcomeSchema,
    name: z.string(),
    confidence: z.number(),
    probabilities: probabilitiesSchema,
  }),
  edge: z.object({
    /** Weighted composite in [-1, 1], positive favours fighter_a. */
    value: z.number(),
    favors: z.enum(["a", "b", "even"]),
    label: z.string(),
    magnitude: z.number(),
    dimensions: z.array(dimensionVerdictSchema),
  }),
  coinFlip: z.object({
    probability: z.number(),
    isCoinFlip: z.boolean(),
  }),
  /** Winner Choice and composite edge disagree in direction. */
  split: z.boolean(),
  usage: z
    .object({ inputTokens: z.number(), outputTokens: z.number() })
    .nullable(),
});

export type DimensionVerdict = z.infer<typeof dimensionVerdictSchema>;
export type Verdict = z.infer<typeof verdictSchema>;

/** Raw answer shapes as returned by TypeSafe, validated before use. */
export const rawAnswerSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("choice"),
    choice: z.string(),
    confidence: z.number(),
    probabilities: probabilitiesSchema,
  }),
  z.object({
    type: z.literal("score"),
    score: z.number(),
    confidence: z.number(),
    legend: z.record(z.string(), z.string()),
    probabilities: probabilitiesSchema,
  }),
  z.object({ type: z.literal("noul"), noul: z.number() }),
]);

export type RawAnswer = z.infer<typeof rawAnswerSchema>;
