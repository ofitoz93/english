"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { lookupWord } from "@/lib/dictionary/translate";
import type { CefrLevel } from "@/lib/types";

export type WordFormState = { error?: string } | undefined;

export async function addWord(
  _prevState: WordFormState,
  formData: FormData,
): Promise<WordFormState> {
  const user = await requireUser();
  const input = String(formData.get("word") ?? "").trim();
  if (!input) return { error: "Bir kelime gir." };

  const sourceTitle = String(formData.get("source_title") ?? "").trim() || null;
  const sourceNote = String(formData.get("source_note") ?? "").trim() || null;

  let result;
  try {
    result = await lookupWord(input);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Kelime bulunamadı." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("user_words").upsert(
    {
      user_id: user.id,
      word_en: result.word_en,
      word_tr: result.word_tr,
      level: result.level,
      source_title: sourceTitle,
      source_note: sourceNote,
    },
    { onConflict: "user_id,word_en" },
  );

  if (error) return { error: "Bu kelime eklenemedi." };

  revalidatePath("/words");
  return undefined;
}

export async function deleteWord(id: string) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("user_words").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/words");
}

// Auto-detection only covers the built-in CEFR word list, so most words a
// user adds end up with no level. This lets them set it by hand instead.
export async function updateWordLevel(id: string, level: CefrLevel | null) {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_words")
    .update({ level })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error("Seviye güncellenemedi.");
  revalidatePath("/words");
}
