"use client";

import { useRouter } from "next/navigation";
import { Users, UserPlus, LayoutPanelLeft, LineChart } from "lucide-react";
import type { Problem, Role } from "@/lib/types";
import { getTeamByProblem, getPilotByProblem } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

/**
 * The single most relevant next action for a problem, chosen by its status.
 * Role is available for future tailoring (e.g. org-only edit) but the demo
 * keeps one clear CTA per stage so the flow reads cleanly.
 */
export function ProblemAction({
  problem,
  role,
}: {
  problem: Problem;
  role: Role | null;
}) {
  const { t } = useI18n();
  const router = useRouter();

  const team = getTeamByProblem(problem.id);
  const pilot = getPilotByProblem(problem.id);

  let labelKey: string;
  let icon = Users;
  let go: () => void;

  switch (problem.status) {
    case "open":
      labelKey = "problem.formTeam";
      icon = Users;
      go = () => router.push(`/problems/${problem.id}/team`);
      break;
    case "team-forming":
      labelKey = "problem.joinTeam";
      icon = UserPlus;
      go = () => router.push(`/problems/${problem.id}/team`);
      break;
    case "in-progress":
      labelKey = "problem.viewWorkspace";
      icon = LayoutPanelLeft;
      go = () =>
        team
          ? router.push(`/workspace/${team.workspaceId}`)
          : router.push(`/problems/${problem.id}/team`);
      break;
    case "piloting":
    case "completed":
    default:
      labelKey = "problem.viewPilot";
      icon = LineChart;
      go = () =>
        pilot
          ? router.push(`/pilots/${pilot.id}`)
          : router.push(`/problems/${problem.id}/team`);
      break;
  }

  const Icon = icon;
  // Suppress unused-var lint while keeping the role in the signature.
  void role;

  return (
    <Button size="lg" onClick={go} className="w-full sm:w-auto">
      <Icon />
      {t(labelKey)}
    </Button>
  );
}
