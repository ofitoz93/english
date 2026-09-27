import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="flex-row items-center gap-4 px-5">
            <Skeleton className="size-11 shrink-0 rounded-xl" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-10" />
              <Skeleton className="h-4 w-16" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
