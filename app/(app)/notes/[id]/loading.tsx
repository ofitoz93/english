import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-64 max-w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}
