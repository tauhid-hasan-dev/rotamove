"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";

/** Error boundary for the admin segment. */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { dict, t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-20 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlert className="size-5" aria-hidden />
      </span>
      <p className="text-sm font-medium">{dict.admin.errors.title}</p>
      <p className="max-w-md text-[13px] text-muted-foreground">
        {error.message || dict.admin.errors.unexpected}
        {error.digest ? ` ${t.fill(dict.admin.errors.digest, { digest: error.digest })}` : ""}
      </p>
      <Button variant="outline" size="sm" onClick={reset}>
        {dict.common.tryAgain}
      </Button>
    </div>
  );
}
