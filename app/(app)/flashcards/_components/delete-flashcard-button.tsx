"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteFlashcard } from "@/lib/actions/flashcards";
import { Button } from "@/components/ui/button";

export function DeleteFlashcardButton({
  id,
  imagePath,
}: {
  id: string;
  imagePath: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="icon-sm"
      variant="ghost"
      className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await deleteFlashcard(id, imagePath);
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
