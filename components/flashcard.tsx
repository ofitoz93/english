"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function Flashcard({ imageUrl, word }: { imageUrl: string; word: string }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setFlipped((f) => !f)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setFlipped((f) => !f);
        }
      }}
      className="cursor-pointer [perspective:1000px]"
      aria-label={`${word} kartını çevir`}
    >
      <div
        className={cn(
          "relative aspect-4/3 w-full transition-transform duration-500 [transform-style:preserve-3d]",
          flipped && "[transform:rotateY(180deg)]",
        )}
      >
        <div className="absolute inset-0 overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10 [backface-visibility:hidden]">
          <Image src={imageUrl} alt={word} fill className="object-cover" unoptimized />
        </div>
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-primary text-primary-foreground [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <span className="text-xl font-semibold">{word}</span>
        </div>
      </div>
    </div>
  );
}
