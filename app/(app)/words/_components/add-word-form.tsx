"use client";

import { useActionState, useRef } from "react";
import { addWord } from "@/lib/actions/words";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddWordForm() {
  const [state, action, pending] = useActionState(addWord, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await action(formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
    >
      <Input
        name="word"
        placeholder="Türkçe ya da İngilizce bir kelime yaz..."
        required
        className="max-w-xs"
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Ekleniyor..." : "Ekle"}
      </Button>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
