export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  role: "user" | "admin";
  created_at: string;
};
