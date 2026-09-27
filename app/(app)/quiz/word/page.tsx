"use client";

import { useEffect, useState } from "react";
import {
  getWordQuizQuestion,
  recordQuizAttempt,
  type WordQuizQuestion,
} from "@/lib/actions/quiz";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function WordQuizPage() {
  const [question, setQuestion] = useState<WordQuizQuestion | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  async function loadQuestion() {
    setLoading(true);
    setSelected(null);
    const q = await getWordQuizQuestion();
    setQuestion(q);
    setLoading(false);
  }

  useEffect(() => {
    let ignore = false;
    getWordQuizQuestion().then((q) => {
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
    await recordQuizAttempt(question.wordId, "word", correct);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-semibold">Kelime Quizi</h1>
        <p className="text-sm text-muted-foreground">
          Skor: {score.correct}/{score.total}
        </p>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Yükleniyor...</p>}

      {!loading && !question && (
        <p className="text-sm text-muted-foreground">
          Quiz için önce Kelimelerim sayfasından birkaç kelime eklemelisin.
        </p>
      )}

      {question && (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {question.promptLang === "en" ? "İngilizcesi" : "Türkçesi"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-2xl font-semibold">{question.prompt}</p>
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
            {selected && <Button onClick={loadQuestion}>Sonraki Kelime</Button>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
