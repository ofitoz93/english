"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import {
  getSentenceQuizQuestion,
  recordQuizAttempt,
  type SentenceQuizQuestion,
} from "@/lib/actions/quiz";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CefrLevel } from "@/lib/types";
import { LevelFilter } from "../_components/level-filter";

export default function SentenceQuizPage() {
  const [levels, setLevels] = useState<CefrLevel[]>([]);
  const [question, setQuestion] = useState<SentenceQuizQuestion | null>(null);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  async function loadQuestion(currentLevels: CefrLevel[]) {
    setLoading(true);
    setAnswer(null);
    const q = await getSentenceQuizQuestion(currentLevels.length > 0 ? currentLevels : undefined);
    setQuestion(q);
    setLoading(false);
  }

  useEffect(() => {
    let ignore = false;
    getSentenceQuizQuestion().then((q) => {
      if (!ignore) {
        setQuestion(q);
        setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, []);

  function handleLevelsChange(nextLevels: CefrLevel[]) {
    setLevels(nextLevels);
    loadQuestion(nextLevels);
  }

  async function handleAnswer(userSaysCorrect: boolean) {
    if (!question) return;
    setAnswer(userSaysCorrect);
    const wasRight = userSaysCorrect === question.isCorrect;
    setScore((s) => ({ correct: s.correct + (wasRight ? 1 : 0), total: s.total + 1 }));
    await recordQuizAttempt(question.wordId, "sentence", wasRight);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Cümle Quizi</h1>
        <p className="text-sm text-muted-foreground">
          Skor: {score.correct}/{score.total}
        </p>
      </div>

      <LevelFilter selected={levels} onChange={handleLevelsChange} />

      {loading && <p className="text-sm text-muted-foreground">Yükleniyor...</p>}

      {!loading && !question && (
        <p className="text-sm text-muted-foreground">
          Seçtiğin seviyede kelime bulunamadı. Önce Kelimelerim sayfasından birkaç kelime
          eklemelisin ya da seviye filtresini genişlet.
        </p>
      )}

      {question && (
        <Card className="max-w-md">
          <CardContent className="flex flex-col gap-4">
            <p className="text-lg font-medium">&ldquo;{question.sentence}&rdquo;</p>
            <p className="text-sm text-muted-foreground">
              Bu cümle dilbilgisi açısından doğru mu?
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={answer !== null}
                onClick={() => handleAnswer(true)}
                className={cn(
                  answer !== null && question.isCorrect && "border-emerald-500 text-emerald-600",
                  answer === true && !question.isCorrect && "border-destructive text-destructive",
                )}
              >
                <Check className="size-4" />
                Doğru
              </Button>
              <Button
                variant="outline"
                disabled={answer !== null}
                onClick={() => handleAnswer(false)}
                className={cn(
                  answer !== null && !question.isCorrect && "border-emerald-500 text-emerald-600",
                  answer === false && question.isCorrect && "border-destructive text-destructive",
                )}
              >
                <X className="size-4" />
                Yanlış
              </Button>
            </div>
            {answer !== null && (
              <Button onClick={() => loadQuestion(levels)}>Sonraki Cümle</Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
