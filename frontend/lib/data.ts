// Raw calls to the Sambhav API. Pages read data through useData()
// (lib/data-store.tsx), which is built on these.

import { apiGet, apiPost, apiPatch } from "@/lib/api";
import type {
  Category,
  Pilot,
  Problem,
  Role,
  SharedDoc,
  TaskStatus,
  Team,
  User,
  Workspace,
} from "@/lib/types";

// --- Auth ---
export interface AuthResponse {
  token: string;
  user: User;
}

export const registerUser = (payload: {
  name: string;
  email: string;
  password: string;
  role: Role;
}) => apiPost<AuthResponse>("/auth/register", payload, false);

export const loginUser = (email: string, password: string) =>
  apiPost<AuthResponse>("/auth/login", { email, password }, false);

export const fetchMe = () => apiGet<User>("/auth/me");

// --- Public data ---
export const fetchCategories = () => apiGet<Category[]>("/categories", false);
export const fetchProblems = () => apiGet<Problem[]>("/problems", false);
export const fetchUsers = () => apiGet<User[]>("/users", false);
export const fetchTeams = () => apiGet<Team[]>("/teams", false);
export const fetchWorkspaces = () => apiGet<Workspace[]>("/workspaces", false);
export const fetchPilots = () => apiGet<Pilot[]>("/pilots", false);

// --- Users ---
export const updateMyAvatar = (avatarUrl: string) =>
  apiPatch<User>("/users/me/avatar", { avatarUrl });

// --- Problems ---
export type NewProblem = Pick<
  Problem,
  | "title"
  | "categoryId"
  | "description"
  | "location"
  | "customFieldValues"
  | "dataAttachments"
  | "proofAttachments"
  | "rewardPoints"
>;

export const createProblem = (payload: NewProblem) =>
  apiPost<Problem>("/problems", payload);

export const joinTeam = (teamId: string, userId: string, role: Role) =>
  apiPost<Team>(`/teams/${teamId}/join`, { userId, role });

export const getTeamByProblem = (_problemId: string): Team | undefined => undefined;
export const getPilotByProblem = (_problemId: string): Pilot | undefined => undefined;

/** Joins the problem's team (created on first join). */
export const joinProblem = (problemId: string) =>
  apiPost<{ problem: Problem; team: Team; workspace: Workspace }>(
    `/problems/${problemId}/join`
  );

/** Marks a problem solved and pays out its reward points. */
export const completeProblem = (problemId: string) =>
  apiPost<Problem>(`/problems/${problemId}/complete`);

// --- Workspaces ---
export const addWorkspaceTask = (
  workspaceId: string,
  task: { title: string; assignee?: string }
) => apiPost<Workspace>(`/workspaces/${workspaceId}/tasks`, task);

export const updateWorkspaceTaskStatus = (
  workspaceId: string,
  taskIndex: number,
  status: TaskStatus
) => apiPatch<Workspace>(`/workspaces/${workspaceId}/tasks/${taskIndex}`, { status });

export const addWorkspaceUpdate = (workspaceId: string, text: string) =>
  apiPost<Workspace>(`/workspaces/${workspaceId}/updates`, { text });

export const addWorkspaceDoc = (workspaceId: string, doc: SharedDoc) =>
  apiPost<Workspace>(`/workspaces/${workspaceId}/docs`, doc);
