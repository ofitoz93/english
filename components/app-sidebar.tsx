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
  GraduationCap,
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
    <aside className="sticky top-0 flex h-svh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-3">
      <div className="flex items-center gap-2.5 px-1 py-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <GraduationCap className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="font-heading text-sm font-semibold">İngilizce Öğren</p>
          <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
        </div>
      </div>

      <nav className="mt-2 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}

        {profile.role === "admin" && (
          <>
            <div className="my-2 border-t border-sidebar-border" />
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <ShieldCheck className="size-4" />
              Admin
            </Link>
          </>
        )}
      </nav>

      <form action={logout}>
        <Button
          type="submit"
          variant="ghost"
          className="w-full justify-start gap-2.5 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="size-4" />
          Çıkış Yap
        </Button>
      </form>
    </aside>
  );
}
