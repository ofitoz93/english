"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setUserRole } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

export function RoleToggle({
  userId,
  role,
  disabled,
}: {
  userId: string;
  role: "user" | "admin";
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const nextRole = role === "admin" ? "user" : "admin";

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={disabled || pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await setUserRole(userId, nextRole);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Bir hata oluştu.");
          }
        })
      }
    >
      {role === "admin" ? "Admin yetkisini kaldır" : "Admin yap"}
    </Button>
  );
}
