"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  getFlashcardQuizQuestion,
  recordQuizAttempt,
  type FlashcardQuizQuestion,
} from "@/lib/actions/quiz";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function FlashcardQuizPage() {
  const [question, setQuestion] = useState<FlashcardQuizQuestion | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  async function loadQuestion() {
    setLoading(true);
    setSelected(null);
    const q = await getFlashcardQuizQuestion();
    setQuestion(q);
    setLoading(false);
  }

  useEffect(() => {
    let ignore = false;
    getFlashcardQuizQuestion().then((q) => {
      if (!ignore) {
        setQuestion(q);
        setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, []);

  async function handleAnswer(option: string) {
    if (!question) return;
    setSelected(option);
    const correct = option === question.correctAnswer;
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    await recordQuizAttempt(question.wordId, "flashcard", correct);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Flashcard Quizi</h1>
        <p className="text-sm text-muted-foreground">
          Skor: {score.correct}/{score.total}
        </p>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Yükleniyor...</p>}

      {!loading && !question && (
        <p className="text-sm text-muted-foreground">
          Quiz için önce Flashcard&apos;lar sayfasından birkaç kart oluşturmalısın.
        </p>
      )}

      {question && (
        <Card className="max-w-md">
          <CardContent className="flex flex-col gap-3">
            <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-muted">
              <Image
                src={question.imageUrl}
                alt="Flashcard"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {question.options.map((option) => {
                const isCorrect = option === question.correctAnswer;
                const isSelected = option === selected;
                return (
                  <Button
                    key={option}
                    variant="outline"
                    disabled={!!selected}
                    onClick={() => handleAnswer(option)}
                    className={cn(
                      selected && isCorrect && "border-emerald-500 text-emerald-600",
                      selected &&
                        isSelected &&
                        !isCorrect &&
                        "border-destructive text-destructive",
                    )}
                  >
                    {option}
                  </Button>
                );
              })}
            </div>
            {selected && <Button onClick={loadQuestion}>Sonraki Kart</Button>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
