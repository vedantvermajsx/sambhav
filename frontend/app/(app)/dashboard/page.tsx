"use client";

import { useMemo, useState } from "react";
import type { ProblemStatus } from "@/lib/types";
import { useData } from "@/lib/data-store";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { ProblemCard } from "@/components/problem-card";
import { StatTile } from "@/components/stat-tile";
import { FilterPills, type PillOption } from "@/components/filter-pills";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Inbox, FolderOpen, Users, CheckCircle2, PlusCircle } from "lucide-react";

const STATUSES: ProblemStatus[] = ["open", "in-progress", "completed"];
const ALL = "all";
const MINE = "mine";

export default function DashboardPage() {
  const { t } = useI18n();
  const { user, role } = useSession();
  const { getProblems, getCategories, getTeamByProblem, loading, error, refetch } =
    useData();
  const problems = getProblems();
  const categories = getCategories();

  const [categoryId, setCategoryId] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const [scope, setScope] = useState<string>(ALL);

  const stats = useMemo(
    () => ({
      open: problems.filter((p) => p.status === "open").length,
      working: problems.filter((p) => p.status === "in-progress").length,
      solved: problems.filter((p) => p.status === "completed").length,
    }),
    [problems]
  );

  // "Mine" = problems I posted (industry) or I'm a team member of (everyone else).
  const isMine = (problemId: string, createdBy: string) =>
    role === "industry"
      ? createdBy === user?.id
      : !!getTeamByProblem(problemId)?.members.some((m) => m.userId === user?.id);

  const filtered = problems.filter(
    (p) =>
      (categoryId === ALL || p.categoryId === categoryId) &&
      (status === ALL || p.status === status) &&
      (scope === ALL || isMine(p.id, p.createdBy))
  );

  const categoryOptions: PillOption[] = [
    { value: ALL, label: t("dashboard.filter.all") },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];
  const statusOptions: PillOption[] = [
    { value: ALL, label: t("dashboard.filter.all") },
    ...STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) })),
  ];
  const scopeOptions: PillOption[] = [
    { value: ALL, label: t("dashboard.filter.all") },
    {
      value: MINE,
      label: t(role === "industry" ? "dashboard.scope.posted" : "dashboard.scope.working"),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => refetch()}>
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            {t("dashboard.title")}
          </h1>
          <p className="mt-1 text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>
        {role === "industry" && (
          <Button asChild size="lg">
            <Link href="/submit">
              <PlusCircle />
              {t("nav.submit")}
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatTile icon={FolderOpen} value={stats.open} label={t("dashboard.stat.open")} />
        <StatTile icon={Users} value={stats.working} label={t("dashboard.stat.working")} />
        <StatTile icon={CheckCircle2} value={stats.solved} label={t("dashboard.stat.solved")} />
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-muted/40 p-4">
        <FilterPills
          label={t("dashboard.filter.category")}
          options={categoryOptions}
          value={categoryId}
          onChange={setCategoryId}
        />
        <FilterPills
          label={t("dashboard.filter.status")}
          options={statusOptions}
          value={status}
          onChange={setStatus}
        />
        <FilterPills
          label={t("dashboard.filter.show")}
          options={scopeOptions}
          value={scope}
          onChange={setScope}
        />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          {t("dashboard.allProblems")}
        </h2>
        <span className="text-sm text-muted-foreground">
          {t("dashboard.resultCount", { count: filtered.length })}
        </span>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProblemCard key={p.id} problem={p} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
          <Inbox className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground">
            {problems.length === 0
              ? t(role === "industry" ? "dashboard.emptyIndustry" : "dashboard.empty")
              : t("dashboard.noMatch")}
          </p>
        </div>
      )}
    </div>
  );
}
