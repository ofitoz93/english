"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { lookupWord } from "@/lib/dictionary/translate";
import { WORD_TYPES, type CefrLevel, type WordType } from "@/lib/types";

const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// user_words.word_tr/level are a denormalized summary of word_meanings, kept
// in sync here so existing quiz/listing code (which reads them directly)
// doesn't need to know about the meanings table.
async function syncWordSummary(supabase: SupabaseServerClient, userWordId: string) {
  const { data: meanings } = await supabase
    .from("word_meanings")
    .select("word_tr, level, created_at")
    .eq("user_word_id", userWordId)
    .order("created_at", { ascending: true });

  const wordTr = [...new Set((meanings ?? []).map((m) => m.word_tr))];
  const level = (meanings?.[0]?.level as CefrLevel | null) ?? null;

  await supabase.from("user_words").update({ word_tr: wordTr, level }).eq("id", userWordId);
}

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

function parseWordType(value: FormDataEntryValue | null): WordType {
  const str = String(value ?? "");
  if (!(WORD_TYPES as readonly string[]).includes(str)) {
    throw new Error("Geçerli bir kelime türü seç.");
  }
  return str as WordType;
}

function parseLevel(value: FormDataEntryValue | null): CefrLevel {
  const str = String(value ?? "");
  if (!CEFR_LEVELS.includes(str as CefrLevel)) {
    throw new Error("Geçerli bir seviye seç.");
  }
  return str as CefrLevel;
}

// Live duplicate check used while the user is still typing in the detailed
// add dialog, before they hit save.
export async function checkWordExists(wordEn: string): Promise<boolean> {
  const user = await requireUser();
  const normalized = wordEn.trim().toLowerCase();
  if (!normalized) return false;

  const supabase = await createClient();
  const { data } = await supabase
    .from("user_words")
    .select("id")
    .eq("user_id", user.id)
    .eq("word_en", normalized)
    .maybeSingle();

  return !!data;
}

// Detailed add flow: every field (word type, level, example sentence) is
// entered by hand instead of looked up automatically. Rejects the save
// outright if the English word is already on the user's list.
export async function addWordManual(formData: FormData) {
  const user = await requireUser();

  const wordEn = String(formData.get("word_en") ?? "").trim().toLowerCase();
  const wordTr = String(formData.get("word_tr") ?? "").trim();
  const exampleSentence = String(formData.get("example_sentence") ?? "").trim() || null;
  const wordType = parseWordType(formData.get("word_type"));
  const level = parseLevel(formData.get("level"));

  if (!wordEn) throw new Error("İngilizce kelime gerekli.");
  if (!wordTr) throw new Error("Türkçe anlam gerekli.");

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("user_words")
    .select("id")
    .eq("user_id", user.id)
    .eq("word_en", wordEn)
    .maybeSingle();

  if (existing) throw new Error("Bu kelime zaten listende.");

  const { data: inserted, error: insertError } = await supabase
    .from("user_words")
    .insert({ user_id: user.id, word_en: wordEn, word_tr: [wordTr], level })
    .select("id")
    .single();

  if (insertError || !inserted) throw new Error("Bu kelime eklenemedi.");

  const { error: meaningError } = await supabase.from("word_meanings").insert({
    user_id: user.id,
    user_word_id: inserted.id,
    word_tr: wordTr,
    word_type: wordType,
    level,
    example_sentence: exampleSentence,
  });

  if (meaningError) {
    await supabase.from("user_words").delete().eq("id", inserted.id);
    throw new Error("Anlam eklenemedi.");
  }

  revalidatePath("/words");
}

// Adds another meaning tag to a word that's already on the list. Not subject
// to the duplicate check since word_en isn't changing.
export async function addMeaning(userWordId: string, formData: FormData) {
  const user = await requireUser();

  const wordTr = String(formData.get("word_tr") ?? "").trim();
  const exampleSentence = String(formData.get("example_sentence") ?? "").trim() || null;
  const wordType = parseWordType(formData.get("word_type"));
  const level = parseLevel(formData.get("level"));

  if (!wordTr) throw new Error("Türkçe anlam gerekli.");

  const supabase = await createClient();
  const { error } = await supabase.from("word_meanings").insert({
    user_id: user.id,
    user_word_id: userWordId,
    word_tr: wordTr,
    word_type: wordType,
    level,
    example_sentence: exampleSentence,
  });

  if (error) throw new Error("Anlam eklenemedi.");

  await syncWordSummary(supabase, userWordId);
  revalidatePath("/words");
}

export async function updateMeaning(meaningId: string, formData: FormData) {
  const user = await requireUser();

  const wordTr = String(formData.get("word_tr") ?? "").trim();
  const exampleSentence = String(formData.get("example_sentence") ?? "").trim() || null;
  const wordType = parseWordType(formData.get("word_type"));
  const level = parseLevel(formData.get("level"));

  if (!wordTr) throw new Error("Türkçe anlam gerekli.");

  const supabase = await createClient();
  const { data: meaning, error } = await supabase
    .from("word_meanings")
    .update({ word_tr: wordTr, word_type: wordType, level, example_sentence: exampleSentence })
    .eq("id", meaningId)
    .eq("user_id", user.id)
    .select("user_word_id")
    .single();

  if (error || !meaning) throw new Error("Anlam güncellenemedi.");

  await syncWordSummary(supabase, meaning.user_word_id);
  revalidatePath("/words");
}

export async function deleteMeaning(meaningId: string, userWordId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { count } = await supabase
    .from("word_meanings")
    .select("id", { count: "exact", head: true })
    .eq("user_word_id", userWordId);

  if ((count ?? 0) <= 1) {
    throw new Error("Bir kelimenin en az bir anlamı olmalı.");
  }

  const { error } = await supabase
    .from("word_meanings")
    .delete()
    .eq("id", meaningId)
    .eq("user_id", user.id);

  if (error) throw new Error("Anlam silinemedi.");

  await syncWordSummary(supabase, userWordId);
  revalidatePath("/words");
}
