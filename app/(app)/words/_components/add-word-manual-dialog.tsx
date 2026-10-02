"use client";

import { useEffect, useState } from "react";
import { ListPlus } from "lucide-react";
import { toast } from "sonner";
import { addWordManual, checkWordExists } from "@/lib/actions/words";
import { WORD_TYPES, type CefrLevel, type WordType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

const EMPTY_FORM = {
  wordEn: "",
  wordTr: "",
  wordType: "" as WordType | "",
  level: "" as CefrLevel | "",
  exampleSentence: "",
};

export function AddWordManualDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [duplicate, setDuplicate] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const wordEn = form.wordEn.trim();
    if (!wordEn) return;

    let cancelled = false;
    (async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      if (cancelled) return;
      setChecking(true);
      try {
        const exists = await checkWordExists(wordEn);
        if (!cancelled) setDuplicate(exists);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [form.wordEn]);

  function reset() {
    setForm(EMPTY_FORM);
    setDuplicate(false);
    setError(null);
  }

  async function handleSubmit() {
    setError(null);
    if (!form.wordEn.trim()) return setError("İngilizce kelime gerekli.");
    if (!form.wordTr.trim()) return setError("Türkçe anlam gerekli.");
    if (!form.wordType) return setError("Kelime türünü seç.");
    if (!form.level) return setError("Seviyeyi seç.");
    if (duplicate) return setError("Bu kelime zaten listende.");

    setPending(true);
    try {
      const formData = new FormData();
      formData.set("word_en", form.wordEn);
      formData.set("word_tr", form.wordTr);
      formData.set("word_type", form.wordType);
      formData.set("level", form.level);
      formData.set("example_sentence", form.exampleSentence);
      await addWordManual(formData);

      toast.success("Kelime eklendi.");
      setOpen(false);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline">
            <ListPlus className="size-4" />
            Detaylı Ekle
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detaylı Kelime Ekle</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="manual-word-en">İngilizce kelime</Label>
            <Input
              id="manual-word-en"
              value={form.wordEn}
              onChange={(e) => {
                const value = e.target.value;
                setForm((f) => ({ ...f, wordEn: value }));
                if (!value.trim()) {
                  setDuplicate(false);
                  setChecking(false);
                }
              }}
              placeholder="apple"
              aria-invalid={duplicate}
            />
            {checking && (
              <p className="text-xs text-muted-foreground">Kontrol ediliyor...</p>
            )}
            {!checking && duplicate && (
              <p className="text-xs text-destructive">Bu kelime zaten listende.</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="manual-word-tr">Türkçe anlamı</Label>
            <Input
              id="manual-word-tr"
              value={form.wordTr}
              onChange={(e) => setForm((f) => ({ ...f, wordTr: e.target.value }))}
              placeholder="elma"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label>Kelime türü</Label>
              <Select
                value={form.wordType}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, wordType: value as WordType }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seç..." />
                </SelectTrigger>
                <SelectContent>
                  {WORD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-1 flex-col gap-1.5">
              <Label>Seviye</Label>
              <Select
                value={form.level}
                onValueChange={(value) => setForm((f) => ({ ...f, level: value as CefrLevel }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seç..." />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="manual-example">Örnek cümle</Label>
            <Textarea
              id="manual-example"
              value={form.exampleSentence}
              onChange={(e) => setForm((f) => ({ ...f, exampleSentence: e.target.value }))}
              placeholder="She eats an apple every morning."
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={pending || duplicate}>
            {pending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
