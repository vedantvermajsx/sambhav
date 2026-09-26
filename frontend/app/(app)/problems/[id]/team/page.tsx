"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  UserPlus,
  CheckCircle2,
  UserCheck,
  LayoutPanelLeft,
} from "lucide-react";
import { useData } from "@/lib/data-store";
import type { Role, TeamMember, OpenSlot } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { CategoryBadge } from "@/components/category-badge";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function TeamPage({ params }: PageProps<"/problems/[id]/team">) {
  const { id } = use(params);
  const { t } = useI18n();
  const { role, user } = useSession();
  const router = useRouter();
  const { getProblem, getCategory, getTeamByProblem, getUser, joinTeam } =
    useData();

  const problem = getProblem(id);
  if (!problem) notFound();

  const category = getCategory(problem.categoryId);
  const seedTeam = getTeamByProblem(problem.id);

  // Local team state, kept in sync with the backend. Seeded from whatever the
  // cache currently has; "join" below calls the API then reconciles this from
  // the server's response (source of truth for slot counts).
  const [members, setMembers] = useState<TeamMember[]>(
    seedTeam?.members ?? []
  );
  const [openSlots, setOpenSlots] = useState<OpenSlot[]>(
    seedTeam?.openSlots ?? []
  );
  const [joining, setJoining] = useState<Role | null>(null);

  const totalSlots = useMemo(
    () => members.length + openSlots.reduce((sum, s) => sum + s.count, 0),
    [members, openSlots]
  );
  const filled = members.length;
  const percent = totalSlots === 0 ? 100 : Math.round((filled / totalSlots) * 100);
  const complete = openSlots.length === 0;

  // Join an open slot as the given role via the backend, then reconcile local
  // state from the returned team.
  async function join(joinRole: Role) {
    if (!seedTeam || !user || joining) return;
    setJoining(joinRole);
    try {
      const updated = await joinTeam(seedTeam.id, user.id, joinRole);
      setMembers(updated.members);
      setOpenSlots(updated.openSlots);
      toast.success(t("team.joined", { role: t(`role.${joinRole}`) }));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't join that slot."
      );
    } finally {
      setJoining(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {/* Back */}
      <Link
        href={`/problems/${problem.id}`}
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("problem.backToDashboard")}
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-3">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          {t("team.title")}
        </h1>
        <p className="text-muted-foreground">{t("team.subtitle")}</p>
        {/* Problem the team is being built for */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-card p-3 ring-1 ring-foreground/10">
          {category && <CategoryBadge category={category} />}
          <StatusBadge status={problem.status} />
          <span className="text-sm font-medium text-foreground">
            {problem.title}
          </span>
        </div>
      </div>

      {/* Progress */}
      <section className="flex flex-col gap-2 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            {t("team.progress")}
          </h2>
          <span className="text-sm font-medium text-foreground">
            {t("team.filledOf", { filled, total: totalSlots })}
          </span>
        </div>
        <Progress value={percent} className="h-2" />
      </section>

      {/* Members */}
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-medium text-foreground">
          {t("team.members")}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            · {t("team.memberCount", { count: filled })}
          </span>
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {members.map((m, i) => (
            <MemberCard
              key={`${m.userId}-${i}`}
              member={m}
              youLabel={t("team.you")}
              roleLabel={t(`role.${m.role}`)}
              skillsLabel={t("team.skills")}
            />
          ))}
        </div>
      </section>

      {/* Open roles OR complete state */}
      {complete ? (
        <section className="flex flex-col items-start gap-3 rounded-xl bg-primary/8 p-5 ring-1 ring-primary/20">
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="size-5" />
            <h2 className="font-heading text-lg font-medium">
              {t("team.complete")}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("team.completeHint")}
          </p>
          {seedTeam && (
            <Button onClick={() => router.push(`/workspace/${seedTeam.workspaceId}`)}>
              <LayoutPanelLeft />
              {t("team.openWorkspace")}
            </Button>
          )}
        </section>
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-medium text-foreground">
            {t("team.openRoles")}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {openSlots.map((s) => {
              const matchesYou = role === s.role;
              return (
                <div
                  key={s.role}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10",
                    matchesYou && "ring-2 ring-primary"
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-heading text-base font-medium text-foreground">
                      {t(`role.${s.role}`)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {t("team.slotsOpen", { count: s.count })}
                    </span>
                    {matchesYou && (
                      <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                        <UserCheck className="size-3" />
                        {t("team.matchesYou")}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={matchesYou ? "default" : "outline"}
                    onClick={() => join(s.role)}
                    disabled={joining !== null}
                  >
                    <UserPlus />
                    {t("team.join", { role: t(`role.${s.role}`) })}
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

/** One team member: avatar, name, role, and skill chips resolved from the user. */
function MemberCard({
  member,
  youLabel,
  roleLabel,
  skillsLabel,
}: {
  member: TeamMember;
  youLabel: string;
  roleLabel: string;
  skillsLabel: string;
}) {
  const { getUser } = useData();
  const user = getUser(member.userId);
  const isYou = !user; // freshly-joined "you" has no seeded user record
  const name = user?.name ?? youLabel;
  const initials =
    user?.initials ?? (isYou ? "YOU" : name.slice(0, 2).toUpperCase());
  const skills = user?.skills ?? [];

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex items-center gap-3">
        <UserAvatar
          className="size-10"
          src={user?.avatarUrl}
          initials={initials}
        />
        <div className="flex flex-col">
          <span className="font-heading text-sm font-medium text-foreground">
            {name}
            {isYou && (
              <span className="ml-1.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                {youLabel}
              </span>
            )}
          </span>
          <span className="text-xs text-muted-foreground">{roleLabel}</span>
        </div>
      </div>
      {skills.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">{skillsLabel}</span>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
