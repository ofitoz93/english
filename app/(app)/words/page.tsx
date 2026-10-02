import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clapperboard } from "lucide-react";
import { SpeakButton } from "@/components/speak-button";
import { AddWordForm } from "./_components/add-word-form";
import { AddWordManualDialog } from "./_components/add-word-manual-dialog";
import { DeleteWordButton } from "./_components/delete-word-button";
import { EditWordDialog } from "./_components/edit-word-dialog";
import { LevelSelect } from "./_components/level-select";
import type { CefrLevel, WordMeaning } from "@/lib/types";

type UserWord = {
  id: string;
  word_en: string;
  word_tr: string[];
  level: CefrLevel | null;
  source_title: string | null;
  source_note: string | null;
  created_at: string;
  word_meanings: WordMeaning[];
};

const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "A1", label: "A1" },
  { value: "A2", label: "A2" },
  { value: "B1", label: "B1" },
  { value: "B2", label: "B2" },
  { value: "C1", label: "C1" },
  { value: "C2", label: "C2" },
  { value: "none", label: "Belirsiz" },
];

export default async function WordsPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const params = await searchParams;
  const level = params.level ?? "all";

  await requireUser();
  const supabase = await createClient();

  let query = supabase
    .from("user_words")
    .select("*, word_meanings(*)")
    .order("created_at", { ascending: false })
    .order("created_at", { ascending: true, referencedTable: "word_meanings" });

  if (level === "none") {
    query = query.is("level", null);
  } else if (level !== "all") {
    query = query.eq("level", level);
  }

  const { data: words } = await query.returns<UserWord[]>();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Kelimelerim</h1>
        <p className="text-sm text-muted-foreground">
          Türkçe ya da İngilizce bir kelime yaz, karşılığını ve seviyesini otomatik bul.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <AddWordForm />
        <AddWordManualDialog />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value === "all" ? "/words" : `/words?level=${filter.value}`}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              level === filter.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>İngilizce</TableHead>
            <TableHead>Türkçe</TableHead>
            <TableHead>Seviye</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {words?.map((word) => (
            <TableRow key={word.id}>
              <TableCell className="font-medium">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1">
                    {word.word_en}
                    <SpeakButton text={word.word_en} lang="en-US" />
                  </div>
                  {word.source_title && (
                    <div className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                      <Clapperboard className="size-3 shrink-0" />
                      <span className="truncate">
                        {word.source_title}
                        {word.source_note && ` — “${word.source_note}”`}
                      </span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {word.word_tr.length > 1 ? (
                  <div className="flex flex-wrap gap-1">
                    {word.word_tr.map((meaning) => (
                      <Badge key={meaning} variant="secondary" className="font-normal">
                        {meaning}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  word.word_tr[0]
                )}
              </TableCell>
              <TableCell>
                <LevelSelect id={word.id} level={word.level} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-0.5">
                  <EditWordDialog
                    userWordId={word.id}
                    wordEn={word.word_en}
                    meanings={word.word_meanings}
                  />
                  <DeleteWordButton id={word.id} />
                </div>
              </TableCell>
            </TableRow>
          ))}
          {words?.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                Henüz kelime eklemedin.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
