"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/provider";

/** Route-transition skeleton: a KPI row and two panels, in page rhythm. */
export default function AdminLoading() {
  const { dict } = useI18n();
  return (
    <div aria-busy="true" aria-label={dict.admin.errors.loading}>
      <Skeleton className="mb-2 h-8 w-56" />
      <Skeleton className="mb-6 h-4 w-80" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}
