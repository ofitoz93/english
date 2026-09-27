"use client";

import { useActionState, useRef, useState } from "react";
import { Clapperboard } from "lucide-react";
import { addWord } from "@/lib/actions/words";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddWordForm() {
  const [state, action, pending] = useActionState(addWord, undefined);
  const [showSource, setShowSource] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await action(formData);
        formRef.current?.reset();
        setShowSource(false);
      }}
      className="flex flex-col gap-2"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          name="word"
          placeholder="Türkçe ya da İngilizce bir kelime yaz..."
          required
          className="max-w-xs"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Ekleniyor..." : "Ekle"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => setShowSource((v) => !v)}
        >
          <Clapperboard className="size-4" />
          {showSource ? "Kaynağı gizle" : "Dizi/film ekle"}
        </Button>
      </div>

      {showSource && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            name="source_title"
            placeholder="Dizi/Film adı (ör. Friends S1E2)"
            className="max-w-xs"
          />
          <Input
            name="source_note"
            placeholder="Not / örnek cümle (opsiyonel)"
            className="max-w-sm"
          />
        </div>
      )}

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
