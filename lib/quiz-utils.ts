export const MIN_CHOICE_OPTIONS = 4;

function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase();
}

export function isAnswerAccepted(input: string, acceptedAnswers: string[]): boolean {
  const normalized = normalizeAnswer(input);
  return acceptedAnswers.some((answer) => normalizeAnswer(answer) === normalized);
}

// Weighted random pick: an item with weight 3 is 3x as likely to be chosen
// as one with weight 1. Used to make words the user keeps getting wrong show
// up more often than ones they already know.
export function weightedPick<T>(items: T[], weight: (item: T) => number): T {
  const weights = items.map(weight);
  const total = weights.reduce((sum, w) => sum + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function weightedShuffle<T>(items: T[], weight: (item: T) => number): T[] {
  const pool = [...items];
  const result: T[] = [];
  while (pool.length > 0) {
    const picked = weightedPick(pool, weight);
    result.push(picked);
    pool.splice(pool.indexOf(picked), 1);
  }
  return result;
}
