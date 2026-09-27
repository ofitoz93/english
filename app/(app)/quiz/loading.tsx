import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="gap-2">
              <Skeleton className="size-10 rounded-lg" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
