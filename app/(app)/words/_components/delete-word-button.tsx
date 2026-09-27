"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteWord } from "@/lib/actions/words";
import { Button } from "@/components/ui/button";

export function DeleteWordButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="icon-sm"
      variant="ghost"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await deleteWord(id);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Silinemedi.");
          }
        })
      }
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
