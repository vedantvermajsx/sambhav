"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Timer, Target, TrendingUp } from "lucide-react";
import { useData } from "@/lib/data-store";
import type { KPI, PilotStatus } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { CategoryBadge } from "@/components/category-badge";
import { KpiChart } from "@/components/kpi-chart";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Pilot status → dot + tint (green = healthy, amber = needs attention).
const PILOT_STATUS_STYLES: Record<PilotStatus, string> = {
  "on-track": "bg-success/12 text-success [--dot:var(--success)]",
  "at-risk": "bg-warning/12 text-warning [--dot:var(--warning)]",
  completed: "bg-muted text-muted-foreground [--dot:var(--muted-foreground)]",
};

export default function PilotPage({ params }: PageProps<"/pilots/[id]">) {
  const { id } = use(params);
  const { t, lang } = useI18n();
  const { getPilot, getProblem, getCategory } = useData();

  const pilot = getPilot(id);
  if (!pilot) notFound();

  const problem = getProblem(pilot.problemId);
  const category = problem ? getCategory(problem.categoryId) : undefined;

  // Format the start date in the active language.
  const startLabel = new Date(pilot.startDate).toLocaleDateString(
    lang === "hi" ? "hi-IN" : "en-IN",
    { day: "numeric", month: "short", year: "numeric" }
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Back */}
      <Link
        href={problem ? `/problems/${problem.id}` : "/dashboard"}
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("pilot.backToProblem")}
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            {t("pilot.title")}
          </h1>
          <span
            className={cn(
              "inline-flex h-6 w-fit items-center gap-1.5 rounded-full px-2.5 text-xs font-medium",
              PILOT_STATUS_STYLES[pilot.status]
            )}
          >
            <span className="size-1.5 rounded-full bg-[var(--dot)]" />
            {t(`pilot.status.${pilot.status}`)}
          </span>
        </div>

        {/* Problem being piloted */}
        {problem && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-card p-3 ring-1 ring-foreground/10">
            {category && <CategoryBadge category={category} />}
            <span className="text-sm font-medium text-foreground">
              {problem.title}
            </span>
          </div>
        )}

        {/* Started + duration facts */}
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-sm text-foreground">
            <CalendarDays className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t("pilot.started")}:</span>
            {startLabel}
          </span>
          <span className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-sm text-foreground">
            <Timer className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t("pilot.duration")}:</span>
            {t("pilot.months", { count: pilot.durationMonths })}
          </span>
        </div>
      </div>

      {/* KPIs */}
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-medium text-foreground">
          {t("pilot.kpis")}
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {pilot.kpis.map((kpi) => (
            <KpiCard key={kpi.name} kpi={kpi} />
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * One KPI: current-vs-target readout, a progress bar toward target, and the
 * weekly trend chart. Handles two goal directions:
 *  - "increase" KPIs (target above the starting baseline) → progress = current/target
 *  - "reduction" KPIs (target below baseline, e.g. faults → 0) → progress = how
 *    far the value has fallen from its baseline toward the target.
 */
function KpiCard({ kpi }: { kpi: KPI }) {
  const { t } = useI18n();

  const baseline = kpi.series[0]?.value ?? 0;
  const isReduction = kpi.target < baseline;

  let percent: number;
  if (isReduction) {
    const span = baseline - kpi.target;
    percent = span <= 0 ? 100 : ((baseline - kpi.currentValue) / span) * 100;
  } else {
    percent = kpi.target === 0 ? 100 : (kpi.currentValue / kpi.target) * 100;
  }
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));

  const unit = kpi.unit ? ` ${kpi.unit}` : "";

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      {/* Name + current/target readout */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-heading text-base font-medium text-foreground">
          {kpi.name}
        </h3>
        <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          <Target className="size-3" />
          {clamped}%
        </span>
      </div>

      {/* Big current value + target hint */}
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">
            {t("pilot.current")}
          </span>
          <span className="font-heading text-3xl font-semibold text-foreground">
            {kpi.currentValue}
            <span className="ml-1 text-base font-normal text-muted-foreground">
              {kpi.unit}
            </span>
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-sm text-muted-foreground">
            {t("pilot.target")}
          </span>
          <span className="text-sm font-medium text-foreground">
            {kpi.target}
            {unit}
          </span>
        </div>
      </div>

      {/* Progress toward target */}
      <Progress value={clamped} className="h-2" />

      {/* Weekly trend chart */}
      <div className="flex flex-col gap-1.5">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <TrendingUp className="size-3.5" />
          {t("pilot.trend")}
        </span>
        <KpiChart series={kpi.series} />
        <div className="flex justify-between text-xs text-muted-foreground">
          {kpi.series.map((p) => (
            <span key={p.week}>
              {t("pilot.week")}
              {p.week}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
