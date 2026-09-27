import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Flashcard } from "@/components/flashcard";
import { CreateFlashcardDialog } from "./_components/create-flashcard-dialog";
import { DeleteFlashcardButton } from "./_components/delete-flashcard-button";

type FlashcardRow = {
  id: string;
  word_en: string;
  image_path: string;
  created_at: string;
};

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export default async function FlashcardsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: flashcards } = await supabase
    .from("flashcards")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<FlashcardRow[]>();

  const withUrls = await Promise.all(
    (flashcards ?? []).map(async (card) => {
      const { data } = await supabase.storage
        .from("flashcards")
        .createSignedUrl(card.image_path, SIGNED_URL_TTL_SECONDS);
      return { ...card, imageUrl: data?.signedUrl ?? null };
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Flashcard&apos;lar</h1>
          <p className="text-sm text-muted-foreground">
            Bir görsel yükle ya da çiz, kartın arkasında kelime görünsün.
          </p>
        </div>
        <CreateFlashcardDialog />
      </div>

      {withUrls.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz flashcard oluşturmadın.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {withUrls.map(
            (card) =>
              card.imageUrl && (
                <div key={card.id} className="relative">
                  <DeleteFlashcardButton id={card.id} imagePath={card.image_path} />
                  <Flashcard imageUrl={card.imageUrl} word={card.word_en} />
                </div>
              ),
          )}
        </div>
      )}
    </div>
  );
}
