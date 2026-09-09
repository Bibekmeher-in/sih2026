import { TableSkeleton } from "@/components/ui/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
      <TableSkeleton rows={8} cols={6} />
    </div>
  );
}
