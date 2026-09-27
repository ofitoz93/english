"use client";

import { useEffect, useState } from "react";
import {
  getWordQuizQuestion,
  recordQuizAttempt,
  type WordQuizQuestion,
  type QuizAnswerMode,
} from "@/lib/actions/quiz";
import { isAnswerAccepted, MIN_CHOICE_OPTIONS } from "@/lib/quiz-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { CefrLevel } from "@/lib/types";
import { LevelFilter } from "../_components/level-filter";

export default function WordQuizPage() {
  const [levels, setLevels] = useState<CefrLevel[]>([]);
  const [answerMode, setAnswerMode] = useState<QuizAnswerMode>("choice");
  const [question, setQuestion] = useState<WordQuizQuestion | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [submittedTyped, setSubmittedTyped] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  async function loadQuestion(mode: QuizAnswerMode, currentLevels: CefrLevel[]) {
    setLoading(true);
    setSelected(null);
    setTypedAnswer("");
    setSubmittedTyped(false);
    const q = await getWordQuizQuestion(
      currentLevels.length > 0 ? currentLevels : undefined,
      mode,
    );
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

  function handleLevelsChange(nextLevels: CefrLevel[]) {
    setLevels(nextLevels);
    loadQuestion(answerMode, nextLevels);
  }

  function handleModeChange(mode: QuizAnswerMode) {
    setAnswerMode(mode);
    loadQuestion(mode, levels);
  }

  async function handleChoiceAnswer(option: string) {
    if (!question) return;
    setSelected(option);
    const correct = isAnswerAccepted(option, question.acceptedAnswers);
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    await recordQuizAttempt(question.wordId, "word", correct);
  }

  async function handleTypedSubmit() {
    if (!question || !typedAnswer.trim()) return;
    setSubmittedTyped(true);
    const correct = isAnswerAccepted(typedAnswer, question.acceptedAnswers);
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    await recordQuizAttempt(question.wordId, "word", correct);
  }

  const typedCorrect =
    question && submittedTyped ? isAnswerAccepted(typedAnswer, question.acceptedAnswers) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Kelime Quizi</h1>
        <p className="text-sm text-muted-foreground">
          Skor: {score.correct}/{score.total}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <LevelFilter selected={levels} onChange={handleLevelsChange} />
        <Tabs
          value={answerMode}
          onValueChange={(value) => handleModeChange(value as QuizAnswerMode)}
        >
          <TabsList>
            <TabsTrigger value="choice">Çoktan Seçmeli</TabsTrigger>
            <TabsTrigger value="typing">Yazarak</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Yükleniyor...</p>}

      {!loading && !question && (
        <p className="text-sm text-muted-foreground">
          Seçtiğin seviyede kelime bulunamadı. Önce Kelimelerim sayfasından birkaç kelime
          eklemelisin ya da seviye filtresini genişlet.
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

            {question.options && (
              <>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {question.options.map((option) => {
                    const isCorrect = isAnswerAccepted(option, question.acceptedAnswers);
                    const isSelected = option === selected;
                    return (
                      <Button
                        key={option}
                        variant="outline"
                        disabled={!!selected}
                        onClick={() => handleChoiceAnswer(option)}
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
                {question.options.length < MIN_CHOICE_OPTIONS && (
                  <p className="text-xs text-muted-foreground">
                    Daha fazla kelime ekledikçe seçenek sayısı artacak.
                  </p>
                )}
                {selected && (
                  <Button onClick={() => loadQuestion(answerMode, levels)}>
                    Sonraki Kelime
                  </Button>
                )}
              </>
            )}

            {!question.options && (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Input
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !submittedTyped) handleTypedSubmit();
                    }}
                    disabled={submittedTyped}
                    placeholder="Cevabını yaz..."
                    autoFocus
                  />
                  {!submittedTyped && (
                    <Button onClick={handleTypedSubmit} disabled={!typedAnswer.trim()}>
                      Kontrol Et
                    </Button>
                  )}
                </div>
                {submittedTyped && (
                  <p
                    className={cn(
                      "text-sm font-medium",
                      typedCorrect ? "text-emerald-600" : "text-destructive",
                    )}
                  >
                    {typedCorrect
                      ? "Doğru!"
                      : `Yanlış. Doğru cevap: ${question.acceptedAnswers.join(" / ")}`}
                  </p>
                )}
                {submittedTyped && (
                  <Button onClick={() => loadQuestion(answerMode, levels)}>
                    Sonraki Kelime
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
