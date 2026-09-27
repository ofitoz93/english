import Link from "next/link";
import { Plus, NotebookText } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { createNote } from "@/lib/actions/notes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type NoteRow = { id: string; title: string; updated_at: string };

export default async function NotesPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: notes } = await supabase
    .from("notes")
    .select("id, title, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .returns<NoteRow[]>();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Notlar</h1>
          <p className="text-sm text-muted-foreground">
            Ders notlarını yaz, PDF olarak indir.
          </p>
        </div>
        <form action={createNote}>
          <Button type="submit">
            <Plus className="size-4" />
            Yeni Not
          </Button>
        </form>
      </div>

      {notes?.length === 0 && (
        <p className="text-sm text-muted-foreground">Henüz not oluşturmadın.</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {notes?.map((note) => (
          <Link key={note.id} href={`/notes/${note.id}`}>
            <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader className="flex-row items-center gap-2.5 space-y-0">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <NotebookText className="size-4" />
                </div>
                <CardTitle className="text-base">{note.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {new Date(note.updated_at).toLocaleString("tr-TR")}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
