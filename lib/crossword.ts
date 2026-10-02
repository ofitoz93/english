// Greedy crossword-style grid generator: starts from one word, then keeps
// attaching remaining words wherever they share a letter with something
// already placed (perpendicular to it), like a real intersecting puzzle.
// Multiple random attempts are made and the attempt that connects the most
// words is kept, since greedy placement can get stuck early on a bad order.

import { weightedShuffle } from "@/lib/quiz-utils";

export type CrosswordSourceWord = { word_en: string; word_tr: string[] };

export type PlacedWord = {
  word_en: string;
  word_tr: string[];
  row: number;
  col: number;
  dir: "across" | "down";
};

export type CrosswordLayout = {
  words: PlacedWord[];
  rows: number;
  cols: number;
};

function wordCells(w: PlacedWord) {
  return w.word_en.split("").map((letter, i) => ({
    row: w.dir === "down" ? w.row + i : w.row,
    col: w.dir === "across" ? w.col + i : w.col,
    letter,
  }));
}

function canPlace(candidate: PlacedWord, placed: PlacedWord[]): boolean {
  const occupied = new Map<string, string>();
  for (const w of placed) {
    for (const c of wordCells(w)) occupied.set(`${c.row},${c.col}`, c.letter);
  }

  let hasIntersection = false;
  for (const c of wordCells(candidate)) {
    const existing = occupied.get(`${c.row},${c.col}`);
    if (existing) {
      if (existing !== c.letter) return false;
      hasIntersection = true;
    }
  }
  return hasIntersection;
}

function tryBuildLayout(
  pool: CrosswordSourceWord[],
  count: number,
  weight: (w: CrosswordSourceWord) => number,
): PlacedWord[] {
  const shuffled = weightedShuffle(pool, weight);
  const [first, ...rest] = shuffled;
  const placed: PlacedWord[] = [{ ...first, row: 0, col: 0, dir: "across" }];

  for (const candidate of rest) {
    if (placed.length >= count) break;

    let placement: PlacedWord | null = null;
    search: for (const target of placed) {
      const dir = target.dir === "across" ? "down" : "across";
      for (let ci = 0; ci < candidate.word_en.length && !placement; ci++) {
        const ch = candidate.word_en[ci];
        for (const tc of wordCells(target)) {
          if (tc.letter !== ch) continue;
          const row = dir === "down" ? tc.row - ci : tc.row;
          const col = dir === "across" ? tc.col - ci : tc.col;
          const attempt: PlacedWord = { ...candidate, row, col, dir };
          if (canPlace(attempt, placed)) {
            placement = attempt;
            break search;
          }
        }
      }
    }

    if (placement) placed.push(placement);
  }

  return placed;
}

export function generateCrossword(
  source: CrosswordSourceWord[],
  count: number,
  weight: (w: CrosswordSourceWord) => number = () => 1,
): CrosswordLayout {
  const eligible = source.filter(
    (w) => /^[a-zA-Z]+$/.test(w.word_en) && w.word_en.length >= 2,
  );
  if (eligible.length === 0) return { words: [], rows: 0, cols: 0 };

  let best: PlacedWord[] = [];
  const attempts = 30;
  for (let i = 0; i < attempts && best.length < count; i++) {
    const result = tryBuildLayout(eligible, count, weight);
    if (result.length > best.length) best = result;
  }

  const minRow = Math.min(0, ...best.map((w) => w.row));
  const minCol = Math.min(0, ...best.map((w) => w.col));
  const words = best.map((w) => ({ ...w, row: w.row - minRow, col: w.col - minCol }));

  const rows = Math.max(0, ...words.map((w) => (w.dir === "down" ? w.row + w.word_en.length : w.row + 1)));
  const cols = Math.max(0, ...words.map((w) => (w.dir === "across" ? w.col + w.word_en.length : w.col + 1)));

  return { words, rows, cols };
}

export type GridCell = { letter: string } | null;

export function buildGrid(layout: CrosswordLayout): GridCell[][] {
  const grid: GridCell[][] = Array.from({ length: layout.rows }, () =>
    Array.from({ length: layout.cols }, () => null as GridCell),
  );

  for (const w of layout.words) {
    for (const c of wordCells(w)) {
      grid[c.row][c.col] = { letter: c.letter };
    }
  }

  return grid;
}

// Turkish clue text to show directly above each word's starting cell. Words
// that start on the same cell (an across/down intersection) share one label.
export function buildStartLabels(layout: CrosswordLayout): Record<string, string> {
  const labels: Record<string, string[]> = {};
  for (const w of layout.words) {
    const key = `${w.row},${w.col}`;
    const clue = w.word_tr[0];
    if (!labels[key]) labels[key] = [];
    if (!labels[key].includes(clue)) labels[key].push(clue);
  }
  return Object.fromEntries(Object.entries(labels).map(([key, clues]) => [key, clues.join(" / ")]));
}

export function isWordCorrect(w: PlacedWord, values: Record<string, string>): boolean {
  return wordCells(w).every(
    (c) => (values[`${c.row},${c.col}`] ?? "").toLowerCase() === c.letter.toLowerCase(),
  );
}
