import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-8 w-28 shrink-0 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex-row items-center gap-2.5 space-y-0">
              <Skeleton className="size-8 shrink-0 rounded-lg" />
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
