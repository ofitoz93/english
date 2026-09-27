import { requireProfile } from "@/lib/dal";
import { AppSidebar } from "@/components/app-sidebar";
import { DailyQuizWidget } from "@/components/daily-quiz-widget";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  return (
    <div className="flex min-h-svh w-full">
      <AppSidebar profile={profile} />
      <main className="flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
      <DailyQuizWidget />
    </div>
  );
}
