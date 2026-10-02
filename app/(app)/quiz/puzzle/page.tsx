"use client";

import { useMemo, useRef, useState } from "react";
import { getCrosswordRound } from "@/lib/actions/puzzle";
import { recordQuizAttempt } from "@/lib/actions/quiz";
import {
  buildGrid,
  buildStartLabels,
  isWordCorrect,
  type CrosswordLayout,
  type GridCell,
} from "@/lib/crossword";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const LEVELS = [3, 4, 5, 6, 8, 10, 15, 20];
const CELL_SIZE_REM = 2.25;

export default function PuzzlePage() {
  const [levelIndex, setLevelIndex] = useState<number | null>(null);
  const [layout, setLayout] = useState<CrosswordLayout>({ words: [], rows: 0, cols: 0 });
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [activeDir, setActiveDir] = useState<"across" | "down">("across");
  const [focusedCell, setFocusedCell] = useState<string | null>(null);
  const solvedRef = useRef(new Set<string>());
  const cellRefs = useRef(new Map<string, HTMLInputElement>());

  async function startLevel(index: number) {
    setLoading(true);
    setLevelIndex(index);
    setGaveUp(false);
    setValues({});
    setActiveDir("across");
    setFocusedCell(null);
    solvedRef.current = new Set();

    const result = await getCrosswordRound(LEVELS[index]);
    setLayout(result);
    setGrid(buildGrid(result));
    setLoading(false);
  }

  function focusCell(row: number, col: number) {
    cellRefs.current.get(`${row},${col}`)?.focus();
  }

  function hasCell(row: number, col: number) {
    return row >= 0 && row < grid.length && col >= 0 && col < (grid[row]?.length ?? 0) && !!grid[row][col];
  }

  // A cell can belong to an across word, a down word, or both (an
  // intersection). Knowing which directions actually pass through a cell is
  // what lets auto-advance keep going the way the user is actually typing
  // instead of always preferring "right".
  function cellDirections(row: number, col: number) {
    return {
      across: hasCell(row, col - 1) || hasCell(row, col + 1),
      down: hasCell(row - 1, col) || hasCell(row + 1, col),
    };
  }

  function handleCellFocus(row: number, col: number) {
    const dirs = cellDirections(row, col);
    if (dirs.across && !dirs.down) setActiveDir("across");
    else if (dirs.down && !dirs.across) setActiveDir("down");
    // at an intersection (both true) keep whatever direction was already
    // active, so continuing to type flows through in the same direction
    setFocusedCell(`${row},${col}`);
  }

  function handleCellClick(row: number, col: number) {
    const key = `${row},${col}`;
    const dirs = cellDirections(row, col);
    // clicking an already-focused intersection cell again toggles direction,
    // same as a real crossword, so you can choose which word to continue
    if (dirs.across && dirs.down && focusedCell === key) {
      setActiveDir((d) => (d === "across" ? "down" : "across"));
    }
    setFocusedCell(key);
  }

  function focusAdjacent(row: number, col: number, dir: 1 | -1) {
    const primary = activeDir === "across" ? { row, col: col + dir } : { row: row + dir, col };
    const fallback = activeDir === "across" ? { row: row + dir, col } : { row, col: col + dir };
    if (hasCell(primary.row, primary.col)) focusCell(primary.row, primary.col);
    else if (hasCell(fallback.row, fallback.col)) focusCell(fallback.row, fallback.col);
  }

  function handleCellChange(row: number, col: number, raw: string) {
    const letter = raw.replace(/[^a-zA-Z]/g, "").slice(-1);
    const key = `${row},${col}`;
    const nextValues = { ...values, [key]: letter };
    setValues(nextValues);

    for (const w of layout.words) {
      if (solvedRef.current.has(w.word_en)) continue;
      if (isWordCorrect(w, nextValues)) {
        solvedRef.current.add(w.word_en);
        recordQuizAttempt(w.word_en, "puzzle", true);
      }
    }

    if (letter) focusAdjacent(row, col, 1);
  }

  function handleKeyDown(row: number, col: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !values[`${row},${col}`]) {
      e.preventDefault();
      const primary = activeDir === "across" ? { row, col: col - 1 } : { row: row - 1, col };
      const fallback = activeDir === "across" ? { row: row - 1, col } : { row, col: col - 1 };
      const target = hasCell(primary.row, primary.col)
        ? primary
        : hasCell(fallback.row, fallback.col)
          ? fallback
          : null;
      if (target) {
        focusCell(target.row, target.col);
        setValues((prev) => ({ ...prev, [`${target.row},${target.col}`]: "" }));
      }
    }
  }

  function handleGiveUp() {
    for (const w of layout.words) {
      if (!solvedRef.current.has(w.word_en)) {
        solvedRef.current.add(w.word_en);
        recordQuizAttempt(w.word_en, "puzzle", false);
      }
    }
    setGaveUp(true);
  }

  const allSolved = layout.words.length > 0 && layout.words.every((w) => isWordCorrect(w, values));
  const finished = allSolved || gaveUp;
  const score = layout.words.filter((w) => isWordCorrect(w, values)).length * 10;
  const hasNextLevel = levelIndex !== null && levelIndex < LEVELS.length - 1;

  function cellStatus(row: number, col: number, letter: string): "empty" | "correct" | "incorrect" | "revealed" {
    const value = values[`${row},${col}`] ?? "";
    if (!value) return gaveUp ? "revealed" : "empty";
    if (value.toLowerCase() === letter.toLowerCase()) return "correct";
    return gaveUp ? "revealed" : "incorrect";
  }

  function cellDisplayValue(row: number, col: number, letter: string): string {
    const value = values[`${row},${col}`] ?? "";
    if (gaveUp && value.toLowerCase() !== letter.toLowerCase()) return letter;
    return value;
  }

  const startLabels = useMemo(() => buildStartLabels(layout), [layout]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Kelime Bulmacası</h1>
        <p className="text-sm text-muted-foreground">
          Kelimeler birbirine harf paylaşarak bağlanır — tıpkı gerçek bir çengel bulmaca gibi.
          Doğru harf yeşil, yanlış harf kırmızı olur.
        </p>
      </div>

      {levelIndex === null && (
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((size, idx) => (
            <Button key={size} variant="outline" onClick={() => startLevel(idx)}>
              {size} Kelimelik
            </Button>
          ))}
        </div>
      )}

      {levelIndex !== null && loading && (
        <p className="text-sm text-muted-foreground">Bulmaca hazırlanıyor...</p>
      )}

      {levelIndex !== null && !loading && layout.words.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Yeterli kelimen yok. Önce Kelimelerim sayfasından birkaç kelime ekle.
        </p>
      )}

      {levelIndex !== null && !loading && layout.words.length > 0 && (
        <Card className="w-fit max-w-full">
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-muted-foreground">
                {LEVELS[levelIndex]} kelimelik bulmaca ({layout.words.length} tanesi bağlandı)
              </p>
              <p className="text-sm font-semibold">Skor: {score}</p>
            </div>

            <div className="overflow-x-auto pt-5">
              <div
                className="grid gap-0.5"
                style={{
                  gridTemplateColumns: `repeat(${layout.cols}, ${CELL_SIZE_REM}rem)`,
                  gridTemplateRows: `repeat(${layout.rows}, ${CELL_SIZE_REM}rem)`,
                }}
              >
                {grid.flatMap((rowCells, row) =>
                  rowCells.map((cell, col) => {
                    if (!cell) return <div key={`${row}-${col}`} />;
                    const status = cellStatus(row, col, cell.letter);
                    const label = startLabels[`${row},${col}`];
                    return (
                      <div key={`${row}-${col}`} className="relative">
                        {label && (
                          <span className="pointer-events-none absolute -top-4 left-0 z-10 whitespace-nowrap text-[10px] leading-none font-medium text-muted-foreground">
                            {label}
                          </span>
                        )}
                        <input
                          ref={(el) => {
                            const key = `${row},${col}`;
                            if (el) cellRefs.current.set(key, el);
                            else cellRefs.current.delete(key);
                          }}
                          value={cellDisplayValue(row, col, cell.letter)}
                          maxLength={1}
                          disabled={finished}
                          onChange={(e) => handleCellChange(row, col, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(row, col, e)}
                          onFocus={() => handleCellFocus(row, col)}
                          onClick={() => handleCellClick(row, col)}
                          className={cn(
                            "size-9 rounded-md border-2 text-center text-base font-bold uppercase outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed",
                            status === "empty" && "border-input bg-background",
                            status === "correct" &&
                              "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                            status === "incorrect" && "border-destructive bg-destructive/10 text-destructive",
                            status === "revealed" && "border-border bg-muted text-muted-foreground",
                          )}
                        />
                      </div>
                    );
                  }),
                )}
              </div>
            </div>

            {!finished && (
              <Button variant="ghost" size="sm" className="self-start" onClick={handleGiveUp}>
                Pes Et
              </Button>
            )}

            {finished && (
              <div className="flex flex-col gap-2 border-t border-border pt-3">
                <p className="text-sm font-medium">
                  {allSolved ? "Bulmaca tamamlandı! 🎉" : "Bulmaca bitti."} Skor: {score}
                </p>
                <div className="flex flex-wrap gap-2">
                  {hasNextLevel && (
                    <Button size="sm" onClick={() => startLevel(levelIndex + 1)}>
                      Sonraki Seviyeye İlerle ({LEVELS[levelIndex + 1]} Kelimelik)
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => startLevel(levelIndex)}>
                    Bu Seviyeyi Tekrarla
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setLevelIndex(null)}>
                    Seviye Değiştir
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
