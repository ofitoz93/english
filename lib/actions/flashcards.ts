"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function createFlashcard(formData: FormData) {
  const user = await requireUser();
  const word = String(formData.get("word") ?? "").trim().toLowerCase();
  const image = formData.get("image");

  if (!word) throw new Error("Bir kelime gir.");
  if (!(image instanceof File) || image.size === 0) {
    throw new Error("Bir görsel yükle ya da çiz.");
  }
  if (image.size > MAX_IMAGE_BYTES) {
    throw new Error("Görsel çok büyük (maksimum 5MB).");
  }

  const supabase = await createClient();
  const path = `${user.id}/${randomUUID()}.png`;

  const { error: uploadError } = await supabase.storage
    .from("flashcards")
    .upload(path, image, { contentType: "image/png" });

  if (uploadError) throw new Error("Görsel yüklenemedi.");

  const { error } = await supabase.from("flashcards").insert({
    user_id: user.id,
    word_en: word,
    image_path: path,
  });

  if (error) {
    await supabase.storage.from("flashcards").remove([path]);
    throw new Error("Flashcard kaydedilemedi.");
  }

  revalidatePath("/flashcards");
}

export async function deleteFlashcard(id: string, imagePath: string) {
  const user = await requireUser();
  const supabase = await createClient();

  await supabase.storage.from("flashcards").remove([imagePath]);

  const { error } = await supabase
    .from("flashcards")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/flashcards");
}
