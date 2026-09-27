import { BookOpen, GalleryVerticalEnd, NotebookText, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/dal";
import { Card } from "@/components/ui/card";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ count: wordCount }, { count: flashcardCount }, { count: noteCount }] =
    await Promise.all([
      supabase.from("user_words").select("*", { count: "exact", head: true }),
      supabase.from("flashcards").select("*", { count: "exact", head: true }),
      supabase.from("notes").select("*", { count: "exact", head: true }),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          Merhaba, {profile.display_name ?? profile.email}
        </h1>
        <p className="text-sm text-muted-foreground">
          İlerlemene genel bir bakış.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Kelime" value={wordCount ?? 0} icon={BookOpen} accent="chart-1" />
        <StatCard
          label="Flashcard"
          value={flashcardCount ?? 0}
          icon={GalleryVerticalEnd}
          accent="chart-2"
        />
        <StatCard label="Not" value={noteCount ?? 0} icon={NotebookText} accent="chart-3" />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: "chart-1" | "chart-2" | "chart-3";
}) {
  return (
    <Card className="flex-row items-center gap-4 px-5">
      <div
        className="flex size-11 shrink-0 items-center justify-center rounded-xl"
        style={{
          backgroundColor: `color-mix(in oklch, var(--${accent}) 18%, transparent)`,
          color: `var(--${accent})`,
        }}
      >
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-2xl font-semibold leading-tight">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}
