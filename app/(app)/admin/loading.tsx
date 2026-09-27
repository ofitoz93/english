import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-56" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full rounded-lg" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
