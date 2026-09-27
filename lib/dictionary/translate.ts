import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CefrLevel } from "@/lib/types";

const TURKISH_CHARS = /[çğıöşüÇĞİÖŞÜ]/;

export type WordLookupResult = {
  word_en: string;
  word_tr: string[];
  level: CefrLevel | null;
};

const MAX_MEANINGS = 4;

// MyMemory's `matches` list is a crowd-sourced translation-memory search, not
// a curated dictionary: it regularly contains corrupted entries (a missing
// diacritic rendered as a stray "." or "?", e.g. "pirinç" -> "pirin.") and
// parenthetical glosses (e.g. "değerlendirme (evaluation)"). This cleans and
// ranks candidates so garbage doesn't end up as a saved meaning.
export function cleanMeanings(rawCandidates: (string | undefined)[], input: string): string[] {
  const seenOrder: string[] = [];
  const counts = new Map<string, number>();

  for (const raw of rawCandidates) {
    if (typeof raw !== "string") continue;
    const cleaned = raw
      .replace(/\([^)]*\)/g, "") // strip parenthetical glosses
      .trim()
      .toLowerCase();

    if (!cleaned) continue;
    if (cleaned === input.toLowerCase()) continue; // echoed the query untranslated
    if (cleaned.includes("?")) continue; // corrupted translation-memory entry
    if (cleaned.endsWith(".")) continue; // usually a mangled diacritic, not real punctuation
    if (cleaned.split(/\s+/).length > 3) continue; // guard against whole sentences

    if (!counts.has(cleaned)) seenOrder.push(cleaned);
    counts.set(cleaned, (counts.get(cleaned) ?? 0) + 1);
  }

  // Candidates repeated across responseData/matches are more likely correct.
  return seenOrder.sort((a, b) => counts.get(b)! - counts.get(a)!).slice(0, MAX_MEANINGS);
}

// MyMemory is a free, keyless translation API. It's rate-limited per IP, which
// is fine here because every word is only ever translated once and cached in
// dictionary_cache for all users afterwards.
async function translateWith(
  text: string,
  from: "en" | "tr",
  to: "en" | "tr",
): Promise<string[]> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Çeviri servisine ulaşılamadı.");
  }

  const data = (await res.json()) as {
    responseData?: { translatedText?: string };
    matches?: { translation?: string }[];
  };

  const meanings = cleanMeanings(
    [data.responseData?.translatedText, ...(data.matches ?? []).map((m) => m.translation)],
    text,
  );

  if (meanings.length === 0) {
    throw new Error("Çeviri sonucu alınamadı.");
  }

  return meanings;
}

export async function lookupWord(rawInput: string): Promise<WordLookupResult> {
  const input = rawInput.trim().toLowerCase();
  if (!input) throw new Error("Bir kelime gir.");

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("dictionary_cache")
    .select("word_en, word_tr, level")
    .or(`word_en.eq.${input},word_tr.cs.{${input}}`)
    .maybeSingle();

  if (existing?.word_tr && existing.word_tr.length > 0) {
    return {
      word_en: existing.word_en,
      word_tr: existing.word_tr,
      level: existing.level as CefrLevel | null,
    };
  }

  let wordEn: string;
  let wordTr: string[];

  if (existing) {
    // Seeded from the static CEFR list, but never translated yet.
    wordEn = existing.word_en;
    wordTr = await translateWith(wordEn, "en", "tr");
  } else if (TURKISH_CHARS.test(input)) {
    wordEn = (await translateWith(input, "tr", "en"))[0];
    wordTr = await translateWith(wordEn, "en", "tr");
    if (!wordTr.includes(input)) wordTr = [input, ...wordTr];
  } else {
    wordEn = input;
    wordTr = await translateWith(input, "en", "tr");
  }

  const level = (existing?.level as CefrLevel | null) ?? null;

  const admin = createAdminClient();
  const { data: upserted } = await admin
    .from("dictionary_cache")
    .upsert(
      { word_en: wordEn, word_tr: wordTr, level, source: level ? "static_list" : "api" },
      { onConflict: "word_en" },
    )
    .select("word_en, word_tr, level")
    .single();

  return {
    word_en: upserted?.word_en ?? wordEn,
    word_tr: upserted?.word_tr ?? wordTr,
    level: (upserted?.level as CefrLevel | null) ?? level,
  };
}
