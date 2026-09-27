import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/dal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        <h1 className="font-heading text-xl font-semibold">
          Merhaba, {profile.display_name ?? profile.email}
        </h1>
        <p className="text-sm text-muted-foreground">
          İlerlemene genel bir bakış.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Kelime" value={wordCount ?? 0} />
        <StatCard label="Flashcard" value={flashcardCount ?? 0} />
        <StatCard label="Not" value={noteCount ?? 0} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
