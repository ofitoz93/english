import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { BookOpen, GalleryVerticalEnd, SpellCheck } from "lucide-react";
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
  },
  {
    href: "/quiz/flashcard",
    title: "Flashcard Quizi",
    description: "Görseli gör, doğru kelimeyi seç.",
    icon: GalleryVerticalEnd,
  },
  {
    href: "/quiz/sentence",
    title: "Cümle Quizi",
    description: "Cümle doğru mu yanlış mı, karar ver.",
    icon: SpellCheck,
  },
];

export default async function QuizPage() {
  await requireUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Quizler</h1>
        <p className="text-sm text-muted-foreground">Bir quiz modu seç.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {MODES.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader className="gap-2">
                <Icon className="size-5 text-muted-foreground" />
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
