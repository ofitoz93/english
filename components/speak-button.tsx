"use client";

import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SpeakButton({
  text,
  lang = "en-US",
  className,
}: {
  text: string;
  lang?: string;
  className?: string;
}) {
  function handleSpeak() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={className}
      onClick={handleSpeak}
      aria-label={`"${text}" kelimesini dinle`}
    >
      <Volume2 className="size-4" />
    </Button>
  );
}
