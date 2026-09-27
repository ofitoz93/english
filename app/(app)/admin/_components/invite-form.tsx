"use client";

import { useActionState } from "react";
import { inviteUser } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InviteForm() {
  const [state, action, pending] = useActionState(inviteUser, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-email">E-posta ile davet et</Label>
          <Input
            id="invite-email"
            name="email"
            type="email"
            placeholder="ornek@eposta.com"
            required
            className="w-64"
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Gönderiliyor..." : "Davet Gönder"}
        </Button>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {state.success}
        </p>
      )}
    </form>
  );
}
