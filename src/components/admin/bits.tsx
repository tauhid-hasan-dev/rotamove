"use client";

import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { StatusMeta } from "@/lib/admin/labels";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

/* Small shared pieces used on every admin page. */

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-[-0.035em]">{title}</h1>
        {description ? (
          <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  delta,
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  /** Fractional change vs the previous period, e.g. 0.12 = +12%. */
  delta?: number;
  hint?: string;
  className?: string;
}) {
  const { dict } = useI18n();
  const showDelta = delta !== undefined && Number.isFinite(delta);
  const up = (delta ?? 0) >= 0;
  return (
    <Card className={cn("shadow-soft", className)}>
      <CardContent className="space-y-1.5">
        <p className="eyebrow">{label}</p>
        <p className="tnum text-[26px] font-semibold leading-none tracking-[-0.03em]">{value}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {showDelta ? (
            <span
              className={cn(
                "tnum inline-flex items-center gap-0.5 font-medium",
                up ? "text-verify" : "text-destructive",
              )}
            >
              {up ? (
                <ArrowUpRight className="size-3.5" aria-hidden />
              ) : (
                <ArrowDownRight className="size-3.5" aria-hidden />
              )}
              {`${up ? "+" : ""}${Math.round((delta ?? 0) * 100)}%`}
            </span>
          ) : null}
          {hint ?? (showDelta ? dict.admin.common.vsPreviousPeriod : "")}
        </p>
      </CardContent>
    </Card>
  );
}

export function StatusBadge({
  meta,
  label,
  className,
}: {
  meta: StatusMeta;
  /** Localized label; falls back to the meta's English one. */
  label?: string;
  className?: string;
}) {
  return (
    <Badge className={cn("border-transparent", meta.className, className)}>
      <span className={cn("size-1.5 rounded-full", meta.dotClassName)} aria-hidden />
      {label ?? meta.label}
    </Badge>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-14 text-center",
        className,
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon ?? <SearchX className="size-5" aria-hidden />}
      </span>
      <p className="text-sm font-medium">{title}</p>
      {description ? (
        <p className="max-w-sm text-[13px] text-muted-foreground">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

/** A label/value line for detail panels. */
export function DetailRow({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 py-2", className)}>
      <dt className="shrink-0 text-[13px] text-muted-foreground">{label}</dt>
      <dd className="text-end text-[13px] font-medium">{children}</dd>
    </div>
  );
}
