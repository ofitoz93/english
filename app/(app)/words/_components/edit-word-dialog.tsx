"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addMeaning, deleteMeaning, updateMeaning } from "@/lib/actions/words";
import { WORD_TYPES, type CefrLevel, type WordMeaning, type WordType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
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
import { SpeakButton } from "@/components/speak-button";

const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

type MeaningFormValue = {
  wordTr: string;
  wordType: WordType | "";
  level: CefrLevel | "";
  exampleSentence: string;
};

function toFormValue(meaning?: WordMeaning): MeaningFormValue {
  return {
    wordTr: meaning?.word_tr ?? "",
    wordType: meaning?.word_type ?? "",
    level: meaning?.level ?? "",
    exampleSentence: meaning?.example_sentence ?? "",
  };
}

function MeaningForm({
  initial,
  onCancel,
  onSubmit,
  submitLabel,
}: {
  initial: MeaningFormValue;
  onCancel: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  submitLabel: string;
}) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!value.wordTr.trim()) return setError("Türkçe anlam gerekli.");
    if (!value.wordType) return setError("Kelime türünü seç.");
    if (!value.level) return setError("Seviyeyi seç.");

    setPending(true);
    try {
      const formData = new FormData();
      formData.set("word_tr", value.wordTr);
      formData.set("word_type", value.wordType);
      formData.set("level", value.level);
      formData.set("example_sentence", value.exampleSentence);
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <Input
        value={value.wordTr}
        onChange={(e) => setValue((v) => ({ ...v, wordTr: e.target.value }))}
        placeholder="Türkçe anlam"
      />
      <div className="flex gap-2">
        <Select
          value={value.wordType}
          onValueChange={(v) => setValue((s) => ({ ...s, wordType: v as WordType }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Tür..." />
          </SelectTrigger>
          <SelectContent>
            {WORD_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={value.level}
          onValueChange={(v) => setValue((s) => ({ ...s, level: v as CefrLevel }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seviye..." />
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
      <Textarea
        value={value.exampleSentence}
        onChange={(e) => setValue((v) => ({ ...v, exampleSentence: e.target.value }))}
        placeholder="Örnek cümle"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Vazgeç
        </Button>
        <Button type="button" size="sm" onClick={handleSubmit} disabled={pending}>
          {pending ? "Kaydediliyor..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}

export function EditWordDialog({
  userWordId,
  wordEn,
  meanings,
}: {
  userWordId: string;
  wordEn: string;
  meanings: WordMeaning[];
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="icon-sm" variant="ghost">
            <Pencil className="size-4" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5">
            {wordEn}
            <SpeakButton text={wordEn} lang="en-US" />
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {meanings.map((meaning) =>
            editingId === meaning.id ? (
              <MeaningForm
                key={meaning.id}
                initial={toFormValue(meaning)}
                submitLabel="Güncelle"
                onCancel={() => setEditingId(null)}
                onSubmit={async (formData) => {
                  await updateMeaning(meaning.id, formData);
                  setEditingId(null);
                }}
              />
            ) : (
              <div
                key={meaning.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-border p-3"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium">{meaning.word_tr}</span>
                    <Badge variant="secondary" className="font-normal">
                      {meaning.word_type}
                    </Badge>
                    {meaning.level && (
                      <Badge variant="outline" className="font-normal">
                        {meaning.level}
                      </Badge>
                    )}
                  </div>
                  {meaning.example_sentence && (
                    <p className="text-sm text-muted-foreground italic">
                      “{meaning.example_sentence}”
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => {
                      setAdding(false);
                      setEditingId(meaning.id);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={async () => {
                      try {
                        await deleteMeaning(meaning.id, userWordId);
                      } catch (err) {
                        toast.error(
                          err instanceof Error ? err.message : "Anlam silinemedi.",
                        );
                      }
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ),
          )}

          {adding ? (
            <MeaningForm
              initial={toFormValue()}
              submitLabel="Ekle"
              onCancel={() => setAdding(false)}
              onSubmit={async (formData) => {
                await addMeaning(userWordId, formData);
                setAdding(false);
              }}
            />
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => {
                setEditingId(null);
                setAdding(true);
              }}
            >
              <Plus className="size-4" />
              Yeni anlam ekle
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
