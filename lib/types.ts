export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export const WORD_TYPES = [
  "İsim",
  "Fiil",
  "Sıfat",
  "Zarf",
  "Zamir",
  "Edat",
  "Bağlaç",
  "Ünlem",
  "Deyim",
] as const;

export type WordType = (typeof WORD_TYPES)[number];

export type WordMeaning = {
  id: string;
  user_word_id: string;
  word_tr: string;
  word_type: WordType;
  level: CefrLevel | null;
  example_sentence: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  role: "user" | "admin";
  created_at: string;
};
