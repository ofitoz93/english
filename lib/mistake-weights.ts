import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Every quiz mode already logs each attempt to quiz_attempts. Reuse that
// history instead of a separate "mistakes" table: a word gets +3 weight per
// wrong attempt, so it keeps showing up more often across every quiz mode
// and the crossword until the user starts getting it right again.
const MISTAKE_BOOST = 3;

export async function getMistakeWeights(
  supabase: SupabaseClient,
  userId: string,
): Promise<Map<string, number>> {
  const { data } = await supabase
    .from("quiz_attempts")
    .select("word_en, correct")
    .eq("user_id", userId);

  const weights = new Map<string, number>();
  for (const row of data ?? []) {
    const current = weights.get(row.word_en) ?? 1;
    weights.set(row.word_en, row.correct ? current : current + MISTAKE_BOOST);
  }
  return weights;
}

export function weightOf(weights: Map<string, number>, wordEn: string): number {
  return weights.get(wordEn) ?? 1;
}
