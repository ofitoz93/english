"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export async function createNote() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notes")
    .insert({ user_id: user.id, title: "Adsız not", content: {} })
    .select("id")
    .single();

  if (error || !data) throw new Error("Not oluşturulamadı.");

  revalidatePath("/notes");
  redirect(`/notes/${data.id}`);
}

export async function updateNote(id: string, title: string, content: unknown) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("notes")
    .update({ title, content })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/notes");
  revalidatePath(`/notes/${id}`);
}

export async function deleteNote(id: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/notes");
}
