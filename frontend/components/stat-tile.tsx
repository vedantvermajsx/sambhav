"use client";

import type { LucideIcon } from "lucide-react";

/** A single metric tile for the dashboard stats band. */
export function StatTile({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: number | string;
  label: string;
}) {
  return (
    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div className="mt-3 font-heading text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </div>
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
    </div>
  );
}
