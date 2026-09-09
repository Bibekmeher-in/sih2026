import { TableSkeleton } from "@/components/ui/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-56" />
      </div>
      <TableSkeleton rows={5} cols={5} />
    </div>
  );
}
