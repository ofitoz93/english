"use client";

import { useActionState } from "react";
import { GraduationCap, BookOpen, GalleryVerticalEnd, NotebookText } from "lucide-react";
import { login } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FEATURES = [
  { icon: BookOpen, label: "Kelime takibi" },
  { icon: GalleryVerticalEnd, label: "Görsel flashcard'lar" },
  { icon: NotebookText, label: "Ders notları" },
];

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl shadow-xl ring-1 ring-border md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-primary p-8 text-primary-foreground md:flex">
          <div>
            <div className="mb-6 flex size-11 items-center justify-center rounded-xl bg-primary-foreground/15">
              <GraduationCap className="size-6" />
            </div>
            <h2 className="font-heading text-2xl font-semibold">İngilizce Öğren</h2>
            <p className="mt-2 text-sm text-primary-foreground/80">
              Kişisel kelime, flashcard ve quiz sistemin. Sadece davetliler için.
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 text-sm">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary-foreground/15">
                  <Icon className="size-3.5" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <Card className="rounded-none border-none shadow-none">
          <CardHeader>
            <CardTitle className="text-xl">Giriş Yap</CardTitle>
            <CardDescription>
              Bu sisteme yalnızca davet edilen kullanıcılar girebilir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={action} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">E-posta</Label>
                <Input id="email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              {state?.error && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Giriş yapılıyor..." : "Giriş Yap"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
