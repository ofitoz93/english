"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { createFlashcard } from "@/lib/actions/flashcards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SketchPad, type SketchPadHandle } from "@/components/sketch-pad";

export function CreateFlashcardDialog() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"upload" | "draw">("upload");
  const [word, setWord] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const sketchRef = useRef<SketchPadHandle>(null);

  async function handleSubmit() {
    setError(null);
    const trimmedWord = word.trim();
    if (!trimmedWord) {
      setError("Bir kelime gir.");
      return;
    }

    setPending(true);
    try {
      let imageFile: File;
      if (mode === "upload") {
        if (!file) {
          setError("Bir görsel seç.");
          setPending(false);
          return;
        }
        imageFile = file;
      } else {
        const dataUrl = await sketchRef.current!.exportImage();
        const blob = await (await fetch(dataUrl)).blob();
        imageFile = new File([blob], "drawing.png", { type: "image/png" });
      }

      const formData = new FormData();
      formData.set("word", trimmedWord);
      formData.set("image", imageFile);
      await createFlashcard(formData);

      setOpen(false);
      setWord("");
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            Yeni Flashcard
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Flashcard</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="flashcard-word">İngilizce kelime</Label>
            <Input
              id="flashcard-word"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="apple"
            />
          </div>

          <Tabs value={mode} onValueChange={(value) => setMode(value as "upload" | "draw")}>
            <TabsList>
              <TabsTrigger value="upload">Görsel Yükle</TabsTrigger>
              <TabsTrigger value="draw">Çiz</TabsTrigger>
            </TabsList>
            <TabsContent value="upload">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </TabsContent>
            <TabsContent value="draw">
              <SketchPad ref={sketchRef} />
            </TabsContent>
          </Tabs>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
