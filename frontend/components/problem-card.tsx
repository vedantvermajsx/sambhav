"use client";

import Link from "next/link";
import { MapPin, ArrowRight, Trophy } from "lucide-react";
import type { Problem } from "@/lib/types";
import { useData } from "@/lib/data-store";
import { useI18n } from "@/lib/i18n";
import { StatusBadge } from "@/components/status-badge";
import { CategoryBadge } from "@/components/category-badge";

/**
 * One problem in the dashboard grid: category, status, title, location, up to
 * two headline details from the category's own fields, who posted it, and the
 * reward on offer.
 */
export function ProblemCard({ problem }: { problem: Problem }) {
  const { t } = useI18n();
  const { getCategory, getUser } = useData();
  const category = getCategory(problem.categoryId);
  const poster = getUser(problem.createdBy);

  const highlights = (category?.customFields ?? []).slice(0, 2).map((f) => ({
    label: f.label,
    value: problem.customFieldValues[f.key],
    unit: f.unit,
  }));

  return (
    <Link
      href={`/problems/${problem.id}`}
      className="group flex h-full flex-col gap-3 rounded-xl bg-card p-4 text-left ring-1 ring-foreground/10 transition-colors hover:ring-foreground/25"
    >
      <div className="flex items-center justify-between gap-2">
        {category ? <CategoryBadge category={category} className="px-2" /> : <span />}
        <StatusBadge status={problem.status} />
      </div>

      <h3 className="font-heading text-base leading-snug font-medium text-foreground">
        {problem.title}
      </h3>

      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="size-3.5 shrink-0" />
        <span className="line-clamp-1">{problem.location}</span>
      </p>

      {highlights.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {highlights.map((h) => (
            <span
              key={h.label}
              className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
            >
              <span className="font-medium text-foreground">{h.value}</span>
              {h.unit ? ` ${h.unit}` : ""} · {h.label}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
        <span className="line-clamp-1 min-w-0 text-xs text-muted-foreground">
          {poster?.name}
        </span>
        {problem.rewardPoints > 0 ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            <Trophy className="size-3.5" />
            {t("common.points", { count: problem.rewardPoints })}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            {t("problem.viewDetails")}
            <ArrowRight className="size-3.5" />
          </span>
        )}
      </div>
    </Link>
  );
}
