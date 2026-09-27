"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  getWordQuizQuestion,
  recordQuizAttempt,
  type WordQuizQuestion,
} from "@/lib/actions/quiz";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "daily-quiz-last-shown";

export function DailyQuizWidget() {
  const [visible, setVisible] = useState(false);
  const [question, setQuestion] = useState<WordQuizQuestion | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date().toDateString();
    if (localStorage.getItem(STORAGE_KEY) === today) return;

    getWordQuizQuestion().then((q) => {
      if (!q) return;
      setQuestion(q);
      setVisible(true);
      localStorage.setItem(STORAGE_KEY, today);
    });
  }, []);

  if (!visible || !question) return null;

  async function handleAnswer(option: string) {
    setSelected(option);
    await recordQuizAttempt(question!.wordId, "daily", option === question!.correctAnswer);
  }

  return (
    <div className="fixed right-4 bottom-4 z-40 w-72">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-sm">Günlük Kelime</CardTitle>
          <Button size="icon-xs" variant="ghost" onClick={() => setVisible(false)}>
            <X className="size-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-lg font-semibold">{question.prompt}</p>
          <div className="flex flex-col gap-1.5">
            {question.options.map((option) => {
              const isCorrect = option === question.correctAnswer;
              const isSelected = option === selected;
              return (
                <Button
                  key={option}
                  variant="outline"
                  size="sm"
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
        </CardContent>
      </Card>
    </div>
  );
}
