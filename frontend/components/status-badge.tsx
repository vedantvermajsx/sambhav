"use client";

import type { ProblemStatus } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Colors carry meaning: gray = nobody yet, blue = being worked on, green = solved.
const STATUS_STYLES: Record<ProblemStatus, string> = {
  open: "bg-card text-muted-foreground ring-1 ring-inset ring-border [--dot:var(--muted-foreground)]",
  "team-forming": "bg-warning/12 text-warning [--dot:var(--warning)]",
  "in-progress": "bg-primary/10 text-primary [--dot:var(--primary)]",
  piloting: "bg-primary/10 text-primary [--dot:var(--primary)]",
  completed: "bg-success/12 text-success [--dot:var(--success)]",
};

export function StatusBadge({
  status,
  className,
}: {
  status: ProblemStatus;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit items-center gap-1.5 rounded-full px-2 text-xs font-medium",
        STATUS_STYLES[status],
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-[var(--dot)]" />
      {t(`status.${status}`)}
    </span>
  );
}
