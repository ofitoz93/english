"use server";

import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { generateCrossword, type CrosswordLayout } from "@/lib/crossword";
import { getMistakeWeights, weightOf } from "@/lib/mistake-weights";

export async function getCrosswordRound(count: number): Promise<CrosswordLayout> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: words } = await supabase
    .from("user_words")
    .select("word_en, word_tr")
    .eq("user_id", user.id);

  if (!words || words.length === 0) return { words: [], rows: 0, cols: 0 };

  const weights = await getMistakeWeights(supabase, user.id);
  return generateCrossword(words, count, (w) => weightOf(weights, w.word_en));
}
