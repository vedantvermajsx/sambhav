"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Award, Coins } from "lucide-react";
import { useData } from "@/lib/data-store";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";

/** The points a student has earned, and which solved problems they came from. */
export default function IncentivesPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { user, role } = useSession();
  const { getProblems, getUser } = useData();

  // Only students earn points, so nobody else has a rewards page.
  useEffect(() => {
    if (role && role !== "student") router.replace("/dashboard");
  }, [role, router]);

  if (role !== "student" || !user) return null;

  const total = getUser(user.id)?.points ?? user.points;
  const earned = getProblems()
    .map((problem) => ({
      problem,
      points: problem.rewards.find((r) => r.userId === user.id)?.points ?? 0,
    }))
    .filter((e) => e.points > 0);

  const dateFormat = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Award className="size-6 text-primary" />
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            {t("incentives.title")}
          </h1>
        </div>
        <p className="text-muted-foreground">{t("incentives.subtitle")}</p>
      </div>

      <section className="flex items-center gap-4 rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
          <Coins className="size-7" />
        </span>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">{t("incentives.earned")}</span>
          <span className="font-heading text-3xl font-semibold text-foreground">
            {t("common.points", { count: total })}
          </span>
        </div>
      </section>

      <p className="text-sm text-muted-foreground">{t("incentives.how")}</p>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-medium text-foreground">
          {t("incentives.history")}
        </h2>
        {earned.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("incentives.empty")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
            {earned.map(({ problem, points }) => (
              <li key={problem.id}>
                <Link
                  href={`/problems/${problem.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-foreground">
                      {problem.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {dateFormat(problem.completedAt)}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary">
                    +{points}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
