export const MIN_CHOICE_OPTIONS = 4;

function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase();
}

export function isAnswerAccepted(input: string, acceptedAnswers: string[]): boolean {
  const normalized = normalizeAnswer(input);
  return acceptedAnswers.some((answer) => normalizeAnswer(answer) === normalized);
}
