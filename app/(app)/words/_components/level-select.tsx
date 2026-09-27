"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateWordLevel } from "@/lib/actions/words";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CefrLevel } from "@/lib/types";

const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
const NONE = "none";

export function LevelSelect({ id, level }: { id: string; level: CefrLevel | null }) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={level ?? NONE}
      disabled={pending}
      onValueChange={(value) => {
        startTransition(async () => {
          try {
            await updateWordLevel(id, value === NONE ? null : (value as CefrLevel));
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Seviye güncellenemedi.");
          }
        });
      }}
    >
      <SelectTrigger size="sm" className="h-6 w-20 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>Belirsiz</SelectItem>
        {LEVELS.map((l) => (
          <SelectItem key={l} value={l}>
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
