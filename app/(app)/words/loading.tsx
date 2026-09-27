import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <Skeleton className="h-24 w-full rounded-xl" />

      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-14 rounded-full" />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
