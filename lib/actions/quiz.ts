"use server";

import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { generateSentenceQuestion } from "@/lib/sentence-quiz";

export type QuizMode = "word" | "flashcard" | "daily" | "sentence";

export type WordQuizQuestion = {
  wordId: string;
  prompt: string;
  promptLang: "en" | "tr";
  correctAnswer: string;
  options: string[];
};

export type FlashcardQuizQuestion = {
  wordId: string;
  imageUrl: string;
  correctAnswer: string;
  options: string[];
};

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export async function getWordQuizQuestion(
  level?: string,
): Promise<WordQuizQuestion | null> {
  const user = await requireUser();
  const supabase = await createClient();

  let query = supabase
    .from("user_words")
    .select("word_en, word_tr")
    .eq("user_id", user.id);

  if (level && level !== "all") query = query.eq("level", level);

  const { data: words } = await query;
  if (!words || words.length === 0) return null;

  const target = words[Math.floor(Math.random() * words.length)];
  const promptLang: "en" | "tr" = Math.random() < 0.5 ? "en" : "tr";
  const prompt = promptLang === "en" ? target.word_en : target.word_tr;
  const correctAnswer = promptLang === "en" ? target.word_tr : target.word_en;

  const distractors = shuffle(words.filter((w) => w.word_en !== target.word_en))
    .slice(0, 3)
    .map((w) => (promptLang === "en" ? w.word_tr : w.word_en));

  return {
    wordId: target.word_en,
    prompt,
    promptLang,
    correctAnswer,
    options: shuffle([correctAnswer, ...distractors]),
  };
}

export async function getFlashcardQuizQuestion(): Promise<FlashcardQuizQuestion | null> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: cards } = await supabase
    .from("flashcards")
    .select("id, word_en, image_path")
    .eq("user_id", user.id);

  if (!cards || cards.length === 0) return null;

  const target = cards[Math.floor(Math.random() * cards.length)];
  const { data: signed } = await supabase.storage
    .from("flashcards")
    .createSignedUrl(target.image_path, 60 * 60);

  if (!signed?.signedUrl) return null;

  const distractors = shuffle(cards.filter((c) => c.id !== target.id))
    .slice(0, 3)
    .map((c) => c.word_en);

  return {
    wordId: target.word_en,
    imageUrl: signed.signedUrl,
    correctAnswer: target.word_en,
    options: shuffle([target.word_en, ...distractors]),
  };
}

export type SentenceQuizQuestion = {
  wordId: string;
  sentence: string;
  isCorrect: boolean;
};

export async function getSentenceQuizQuestion(): Promise<SentenceQuizQuestion | null> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: words } = await supabase
    .from("user_words")
    .select("word_en")
    .eq("user_id", user.id);

  if (!words || words.length === 0) return null;

  const target = words[Math.floor(Math.random() * words.length)];
  const { sentence, isCorrect } = generateSentenceQuestion(target.word_en);

  return { wordId: target.word_en, sentence, isCorrect };
}

export async function recordQuizAttempt(
  wordEn: string,
  mode: QuizMode,
  correct: boolean,
) {
  const user = await requireUser();
  const supabase = await createClient();
  await supabase
    .from("quiz_attempts")
    .insert({ user_id: user.id, word_en: wordEn, mode, correct });
}
