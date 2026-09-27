"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  GalleryVerticalEnd,
  Puzzle,
  NotebookText,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/words", label: "Kelimelerim", icon: BookOpen },
  { href: "/flashcards", label: "Flashcard'lar", icon: GalleryVerticalEnd },
  { href: "/quiz", label: "Quizler", icon: Puzzle },
  { href: "/notes", label: "Notlar", icon: NotebookText },
];

export function AppSidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card p-3">
      <div className="px-2 py-3">
        <p className="font-heading text-sm font-semibold">İngilizce Öğren</p>
        <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}

        {profile.role === "admin" && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
              pathname.startsWith("/admin")
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <ShieldCheck className="size-4" />
            Admin
          </Link>
        )}
      </nav>

      <form action={logout}>
        <Button
          type="submit"
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground"
        >
          <LogOut className="size-4" />
          Çıkış Yap
        </Button>
      </form>
    </aside>
  );
}
