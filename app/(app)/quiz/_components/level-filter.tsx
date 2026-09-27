"use client";

import { cn } from "@/lib/utils";
import type { CefrLevel } from "@/lib/types";

const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export function LevelFilter({
  selected,
  onChange,
}: {
  selected: CefrLevel[];
  onChange: (levels: CefrLevel[]) => void;
}) {
  function toggle(level: CefrLevel) {
    onChange(
      selected.includes(level)
        ? selected.filter((l) => l !== level)
        : [...selected, level],
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">Seviye:</span>
      <button
        type="button"
        onClick={() => onChange([])}
        className={cn(
          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
          selected.length === 0
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-muted-foreground hover:bg-muted",
        )}
      >
        Tümü
      </button>
      {LEVELS.map((level) => (
        <button
          key={level}
          type="button"
          onClick={() => toggle(level)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            selected.includes(level)
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:bg-muted",
          )}
        >
          {level}
        </button>
      ))}
    </div>
  );
}
