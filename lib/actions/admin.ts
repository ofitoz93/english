"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminFormState = { error?: string; success?: string } | undefined;

export async function inviteUser(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { error: "Geçerli bir e-posta adresi gir." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/set-password`,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { success: `${email} adresine davet gönderildi.` };
}

export async function setUserRole(userId: string, role: "user" | "admin") {
  const admin = await requireAdmin();
  if (userId === admin.id && role !== "admin") {
    throw new Error("Kendi admin yetkini kaldıramazsın.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}
