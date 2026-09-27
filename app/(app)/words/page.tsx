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
import { AddWordForm } from "./_components/add-word-form";
import { DeleteWordButton } from "./_components/delete-word-button";
import type { CefrLevel } from "@/lib/types";

type UserWord = {
  id: string;
  word_en: string;
  word_tr: string;
  level: CefrLevel | null;
  created_at: string;
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
    .select("*")
    .order("created_at", { ascending: false });

  if (level === "none") {
    query = query.is("level", null);
  } else if (level !== "all") {
    query = query.eq("level", level);
  }

  const { data: words } = await query.returns<UserWord[]>();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Kelimelerim</h1>
        <p className="text-sm text-muted-foreground">
          Türkçe ya da İngilizce bir kelime yaz, karşılığını ve seviyesini otomatik bul.
        </p>
      </div>

      <AddWordForm />

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value === "all" ? "/words" : `/words?level=${filter.value}`}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              level === filter.value
                ? "border-foreground bg-foreground text-background"
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
              <TableCell className="font-medium">{word.word_en}</TableCell>
              <TableCell>{word.word_tr}</TableCell>
              <TableCell>
                <Badge variant={word.level ? "secondary" : "outline"}>
                  {word.level ?? "Belirsiz"}
                </Badge>
              </TableCell>
              <TableCell>
                <DeleteWordButton id={word.id} />
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
