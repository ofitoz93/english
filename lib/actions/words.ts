"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { lookupWord } from "@/lib/dictionary/translate";

export type WordFormState = { error?: string } | undefined;

export async function addWord(
  _prevState: WordFormState,
  formData: FormData,
): Promise<WordFormState> {
  const user = await requireUser();
  const input = String(formData.get("word") ?? "").trim();
  if (!input) return { error: "Bir kelime gir." };

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
