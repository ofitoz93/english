import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CefrLevel } from "@/lib/types";

const TURKISH_CHARS = /[çğıöşüÇĞİÖŞÜ]/;

export type WordLookupResult = {
  word_en: string;
  word_tr: string;
  level: CefrLevel | null;
};

// MyMemory is a free, keyless translation API. It's rate-limited per IP, which
// is fine here because every word is only ever translated once and cached in
// dictionary_cache for all users afterwards.
async function translateWith(
  text: string,
  from: "en" | "tr",
  to: "en" | "tr",
): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Çeviri servisine ulaşılamadı.");
  }

  const data = (await res.json()) as {
    responseData?: { translatedText?: string };
  };
  const translated = data.responseData?.translatedText;

  if (!translated || typeof translated !== "string") {
    throw new Error("Çeviri sonucu alınamadı.");
  }

  // Guard against multi-word phrases coming back for a single-word query.
  return translated.trim().toLowerCase().split(/\s+/)[0];
}

export async function lookupWord(rawInput: string): Promise<WordLookupResult> {
  const input = rawInput.trim().toLowerCase();
  if (!input) throw new Error("Bir kelime gir.");

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("dictionary_cache")
    .select("word_en, word_tr, level")
    .or(`word_en.eq.${input},word_tr.eq.${input}`)
    .maybeSingle();

  if (existing?.word_tr) {
    return {
      word_en: existing.word_en,
      word_tr: existing.word_tr,
      level: existing.level as CefrLevel | null,
    };
  }

  let wordEn: string;
  let wordTr: string;

  if (existing) {
    // Seeded from the static CEFR list, but never translated yet.
    wordEn = existing.word_en;
    wordTr = await translateWith(wordEn, "en", "tr");
  } else if (TURKISH_CHARS.test(input)) {
    wordTr = input;
    wordEn = await translateWith(input, "tr", "en");
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
