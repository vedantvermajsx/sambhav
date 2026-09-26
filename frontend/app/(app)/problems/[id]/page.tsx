"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  CalendarDays,
  FileText,
  ImageIcon,
  Users,
  Trophy,
  UserPlus,
  LayoutPanelLeft,
  CheckCircle2,
} from "lucide-react";
import { useData } from "@/lib/data-store";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { StatusBadge } from "@/components/status-badge";
import { CategoryBadge } from "@/components/category-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import type { Attachment, Problem } from "@/lib/types";
import { cloudinaryImage, isImageAttachment } from "@/lib/cloudinary";

export default function ProblemDetailPage({ params }: PageProps<"/problems/[id]">) {
  const { id } = use(params);
  const { t, lang } = useI18n();
  const { getProblem, getCategory, getUser, getTeamByProblem, loading } = useData();

  const problem = getProblem(id);

  if (!problem) {
    return loading ? (
      <div className="flex justify-center py-20">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    ) : (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-muted-foreground">{t("problem.notFound")}</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard">{t("problem.backToDashboard")}</Link>
        </Button>
      </div>
    );
  }

  const postedLabel = new Date(problem.createdAt).toLocaleDateString(
    lang === "hi" ? "hi-IN" : "en-IN",
    { day: "numeric", month: "short", year: "numeric" }
  );

  const category = getCategory(problem.categoryId);
  const poster = getUser(problem.createdBy);
  const team = getTeamByProblem(problem.id);

  // Resolve every custom field against the category schema (label + unit),
  // so any category's data renders without domain-specific code.
  const fields = (category?.customFields ?? []).map((f) => ({
    key: f.key,
    label: f.label,
    unit: f.unit,
    value: problem.customFieldValues[f.key],
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("problem.backToDashboard")}
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {category && <CategoryBadge category={category} />}
          <StatusBadge status={problem.status} />
        </div>
        <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
          {problem.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4" />
            {problem.location}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4" />
            {t("problem.posted")}: {postedLabel}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_20rem]">
        {/* Main column */}
        <div className="flex flex-col gap-6">
          {/* Description */}
          <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <h2 className="mb-2 font-heading text-lg font-medium text-foreground">
              {t("problem.details")}
            </h2>
            <p className="leading-relaxed text-foreground/90">
              {problem.description}
            </p>
          </section>

          {/* Dynamic custom fields */}
          <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <h2 className="mb-3 font-heading text-lg font-medium text-foreground">
              {t("problem.metrics")}
            </h2>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {fields.map((f) => (
                <div key={f.key} className="flex flex-col gap-0.5">
                  <dt className="text-sm text-muted-foreground">{f.label}</dt>
                  <dd className="font-heading text-lg font-medium text-foreground">
                    {f.value}
                    {f.unit && (
                      <span className="ml-1 text-sm font-normal text-muted-foreground">
                        {f.unit}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Attachments */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AttachmentList
              title={t("problem.data")}
              items={problem.dataAttachments}
              emptyLabel={t("problem.noAttachments")}
              variant="data"
            />
            <AttachmentList
              title={t("problem.proof")}
              items={problem.proofAttachments}
              emptyLabel={t("problem.noAttachments")}
              variant="proof"
            />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          {/* Reward */}
          <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Trophy className="size-4" />
              {t("problem.reward")}
            </h2>
            <p className="font-heading text-2xl font-semibold text-foreground">
              {problem.rewardPoints > 0
                ? t("common.points", { count: problem.rewardPoints })
                : t("problem.noReward")}
            </p>
            {problem.rewardPoints > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                {t("problem.rewardHint")}
              </p>
            )}
          </section>

          {/* Action */}
          <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              {t("problem.action.heading")}
            </h2>
            <ProblemActions problem={problem} workspaceId={team?.workspaceId} />
          </section>

          {/* Posted by */}
          <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              {t("problem.postedBy")}
            </h2>
            <p className="font-heading text-base font-medium text-foreground">
              {poster?.name}
            </p>
          </section>

          {/* Team */}
          <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <h2 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Users className="size-4" />
              {t("problem.team")}
            </h2>
            {!team || team.members.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("problem.noTeam")}</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {team.members.map((m) => {
                  const member = getUser(m.userId);
                  return (
                    <li key={m.userId} className="flex items-center gap-2.5">
                      <UserAvatar
                        className="size-8"
                        src={member?.avatarUrl}
                        initials={member?.initials ?? "?"}
                        textClassName="text-xs"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                        {member?.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t(`role.${m.role}`)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Points paid out */}
          {problem.status === "completed" && (
            <section className="rounded-xl bg-success/10 p-5 ring-1 ring-success/25">
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-success">
                <CheckCircle2 className="size-4" />
                {t("problem.solved")}
              </h2>
              {problem.rewards.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("problem.noPointsAwarded")}
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {problem.rewards.map((r) => (
                    <li
                      key={r.userId}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="truncate text-foreground">
                        {getUser(r.userId)?.name}
                      </span>
                      <span className="shrink-0 font-medium text-success">
                        +{r.points}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

/**
 * What the signed-in person can do with this problem:
 *  - student / researcher: join the team, then open the workspace
 *  - the industry that posted it: mark it solved (pays out the reward points)
 */
function ProblemActions({
  problem,
  workspaceId,
}: {
  problem: Problem;
  workspaceId?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const { user, role } = useSession();
  const { getTeamByProblem, joinProblem, completeProblem } = useData();
  const [busy, setBusy] = useState(false);

  const team = getTeamByProblem(problem.id);
  const isMember = !!team?.members.some((m) => m.userId === user?.id);
  const isOwner = role === "industry" && problem.createdBy === user?.id;
  const solved = problem.status === "completed";

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  const openWorkspace = workspaceId && (
    <Button
      variant={isOwner && !solved ? "outline" : "default"}
      size="lg"
      className="w-full"
      onClick={() => router.push(`/workspace/${workspaceId}`)}
    >
      <LayoutPanelLeft />
      {t("problem.openWorkspace")}
    </Button>
  );

  if (solved) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{t("problem.alreadySolved")}</p>
        {openWorkspace}
      </div>
    );
  }

  if (isOwner) {
    return (
      <div className="flex flex-col gap-3">
        {problem.status === "in-progress" ? (
          <Button
            size="lg"
            className="w-full"
            disabled={busy}
            onClick={() => {
              if (!window.confirm(t("problem.markSolved.confirm"))) return;
              run(async () => {
                await completeProblem(problem.id);
                toast.success(t("problem.markSolved.done"));
              });
            }}
          >
            <CheckCircle2 />
            {t("problem.markSolved")}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">{t("problem.waiting")}</p>
        )}
        {openWorkspace}
      </div>
    );
  }

  if (role === "student" || role === "researcher") {
    if (isMember) return openWorkspace;
    return (
      <Button
        size="lg"
        className="w-full"
        disabled={busy}
        onClick={() =>
          run(async () => {
            const workspace = await joinProblem(problem.id);
            router.push(`/workspace/${workspace.id}`);
          })
        }
      >
        <UserPlus />
        {t("problem.join")}
      </Button>
    );
  }

  // Another industry account: read-only.
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">{t("problem.viewOnly")}</p>
      {openWorkspace}
    </div>
  );
}

function AttachmentList({
  title,
  items,
  emptyLabel,
  variant,
}: {
  title: string;
  items: Attachment[];
  emptyLabel: string;
  variant: "data" | "proof";
}) {
  const Icon = variant === "proof" ? ImageIcon : FileText;
  const images = items.filter(isImageAttachment);
  const files = items.filter((a) => !isImageAttachment(a));
  const rowClass = "flex items-center gap-2.5 rounded-lg bg-muted px-3 py-2";

  return (
    <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <h2 className="mb-3 font-heading text-base font-medium text-foreground">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {images.length > 0 && (
            <ul className="grid grid-cols-2 gap-2">
              {images.map((a) => (
                <li key={a.url}>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    title={a.name}
                    className="block overflow-hidden rounded-lg ring-1 ring-foreground/10 transition-colors hover:ring-foreground/30"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary already resizes and optimizes this. */}
                    <img
                      src={cloudinaryImage(a.url!, "c_fill,w_400,h_300")}
                      alt={a.name}
                      loading="lazy"
                      className="aspect-4/3 w-full object-cover"
                    />
                  </a>
                </li>
              ))}
            </ul>
          )}
          {files.length > 0 && (
            <ul className="flex flex-col gap-2">
              {files.map((a, i) => {
                const content = (
                  <>
                    <Icon className="size-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {a.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {a.size}
                    </span>
                  </>
                );
                return (
                  <li key={`${a.name}-${i}`}>
                    {a.url ? (
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className={`${rowClass} transition-colors hover:bg-muted/70`}
                      >
                        {content}
                      </a>
                    ) : (
                      <div className={rowClass}>{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
