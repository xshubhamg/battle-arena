import "server-only";

import { TypeSafeClient } from "@typesafe-ai/sdk";

import type { Character } from "@/lib/sources/types";

import { composeVerdict } from "./composite";
import { JUDGE_MODEL } from "./config";
import { buildQuestions } from "./questions";
import { buildState } from "./state";
import { rawAnswerSchema, type RawAnswer, type Verdict } from "./verdict";

let client: TypeSafeClient | null = null;

function getClient(): TypeSafeClient {
  if (!client) {
    client = new TypeSafeClient({
      // A verdict normally lands in 70–500ms. These limits exist for flaky
      // networks: DNS stalls and dropped connections get more attempts with
      // exponential backoff instead of failing the whole battle.
      timeout: 30_000,
      retry: {
        maxRetries: 4,
        backoffInitialMs: 800,
        backoffMaxMs: 8_000,
      },
    });
  }
  return client;
}

/**
 * The live judge. One request, every question in parallel. Runs server-side
 * only: the SDK reads `TYPESAFE_API_KEY` and it must never reach the client.
 */
export async function judgeWithJev(
  a: Character,
  b: Character,
): Promise<Verdict> {
  const result = await getClient().systemOne({
    state: buildState(a, b),
    questions: buildQuestions(a, b),
    model: JUDGE_MODEL,
  });

  // Validate each answer before use so a model or SDK change surfaces as a
  // clear error instead of a silently wrong verdict.
  const answers: Record<string, RawAnswer> = {};
  for (const [id, answer] of Object.entries(result.answers)) {
    const parsed = rawAnswerSchema.safeParse(answer);
    if (parsed.success) answers[id] = parsed.data;
  }

  return composeVerdict({
    answers,
    model: result.model,
    usage: {
      inputTokens: result.usage.input_tokens,
      outputTokens: result.usage.output_tokens,
    },
    fighters: { a, b },
  });
}
