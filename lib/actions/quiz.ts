"use server";

import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { generateSentenceQuestion } from "@/lib/sentence-quiz";
import { MIN_CHOICE_OPTIONS, isAnswerAccepted } from "@/lib/quiz-utils";
import type { CefrLevel } from "@/lib/types";

export type QuizMode = "word" | "flashcard" | "daily" | "sentence";
export type QuizAnswerMode = "choice" | "typing";

export type WordQuizQuestion = {
  wordId: string;
  prompt: string;
  promptLang: "en" | "tr";
  correctAnswer: string;
  acceptedAnswers: string[];
  options: string[] | null;
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
  levels?: CefrLevel[],
  mode: QuizAnswerMode = "choice",
): Promise<WordQuizQuestion | null> {
  const user = await requireUser();
  const supabase = await createClient();

  let query = supabase
    .from("user_words")
    .select("word_en, word_tr")
    .eq("user_id", user.id);

  if (levels && levels.length > 0) query = query.in("level", levels);

  const { data: filtered } = await query;
  if (!filtered || filtered.length === 0) return null;

  const target = filtered[Math.floor(Math.random() * filtered.length)];
  const meanings = target.word_tr.length > 0 ? target.word_tr : [target.word_en];
  const primaryMeaning = meanings[0];
  const promptLang: "en" | "tr" = Math.random() < 0.5 ? "en" : "tr";

  const prompt = promptLang === "en" ? target.word_en : primaryMeaning;
  const correctAnswer = promptLang === "en" ? primaryMeaning : target.word_en;
  const acceptedAnswers = promptLang === "en" ? meanings : [target.word_en];

  let options: string[] | null = null;

  if (mode === "choice") {
    // The target word still respects the level filter, but distractors can
    // come from the full word list so multiple choice can still reach the
    // minimum option count even with a narrow level selection.
    let pool = filtered;
    if (levels && levels.length > 0 && filtered.length < MIN_CHOICE_OPTIONS) {
      const { data: allWords } = await supabase
        .from("user_words")
        .select("word_en, word_tr")
        .eq("user_id", user.id);
      pool = allWords ?? filtered;
    }

    const distractors = shuffle(pool.filter((w) => w.word_en !== target.word_en))
      .map((w) => (promptLang === "en" ? (w.word_tr[0] ?? w.word_en) : w.word_en))
      .filter(
        (value, i, arr) =>
          !isAnswerAccepted(value, [correctAnswer]) && arr.indexOf(value) === i,
      )
      .slice(0, MIN_CHOICE_OPTIONS - 1);

    options = shuffle([correctAnswer, ...distractors]);
  }

  return {
    wordId: target.word_en,
    prompt,
    promptLang,
    correctAnswer,
    acceptedAnswers,
    options,
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

export async function getSentenceQuizQuestion(
  levels?: CefrLevel[],
): Promise<SentenceQuizQuestion | null> {
  const user = await requireUser();
  const supabase = await createClient();

  let query = supabase.from("user_words").select("word_en").eq("user_id", user.id);
  if (levels && levels.length > 0) query = query.in("level", levels);

  const { data: words } = await query;
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
