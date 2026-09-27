// Template + rule based sentence generator (no AI): picks a sentence template,
// then either uses the grammatically correct article ("a"/"an") or swaps it
// for the wrong one, so the quiz can ask "is this sentence correct?".

const TEMPLATES = [
  "This is __ARTICLE__ {word}.",
  "I have __ARTICLE__ {word}.",
  "She bought __ARTICLE__ {word} yesterday.",
  "There is __ARTICLE__ {word} on the table.",
  "He found __ARTICLE__ {word} in the garden.",
  "We saw __ARTICLE__ {word} at the park.",
];

function correctArticle(word: string): "a" | "an" {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function generateSentenceQuestion(wordEn: string): {
  sentence: string;
  isCorrect: boolean;
} {
  const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
  const correct = correctArticle(wordEn);
  const wrong = correct === "a" ? "an" : "a";
  const isCorrect = Math.random() < 0.5;
  const article = isCorrect ? correct : wrong;

  const sentence = capitalize(
    template.replace("__ARTICLE__", article).replace("{word}", wordEn),
  );

  return { sentence, isCorrect };
}
