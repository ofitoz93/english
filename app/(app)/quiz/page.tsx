import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { BookOpen, GalleryVerticalEnd, SpellCheck, Puzzle } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MODES = [
  {
    href: "/quiz/word",
    title: "Kelime Quizi",
    description: "Kelime havuzundan çoktan seçmeli sorular.",
    icon: BookOpen,
    accent: "chart-1",
  },
  {
    href: "/quiz/flashcard",
    title: "Flashcard Quizi",
    description: "Görseli gör, doğru kelimeyi seç.",
    icon: GalleryVerticalEnd,
    accent: "chart-2",
  },
  {
    href: "/quiz/sentence",
    title: "Cümle Quizi",
    description: "Cümle doğru mu yanlış mı, karar ver.",
    icon: SpellCheck,
    accent: "chart-3",
  },
  {
    href: "/quiz/puzzle",
    title: "Kelime Bulmacası",
    description: "Türkçesini oku, İngilizcesini yaz, puan topla.",
    icon: Puzzle,
    accent: "chart-4",
  },
] as const;

export default async function QuizPage() {
  await requireUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Quizler</h1>
        <p className="text-sm text-muted-foreground">Bir quiz modu seç.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODES.map(({ href, title, description, icon: Icon, accent }) => (
          <Link key={href} href={href}>
            <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader className="gap-2">
                <div
                  className="flex size-10 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `color-mix(in oklch, var(--${accent}) 18%, transparent)`,
                    color: `var(--${accent})`,
                  }}
                >
                  <Icon className="size-5" />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
