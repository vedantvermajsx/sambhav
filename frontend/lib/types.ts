// Sambhav — core domain types (mirror the backend models).

/** Who a person signed up as. Only industry can post problems. */
export type Role = "student" | "researcher" | "industry";

/** open = nobody started · in-progress = a team is working · completed = solved. */
export type ProblemStatus =
  | "open"
  | "team-forming"
  | "in-progress"
  | "piloting"
  | "completed";

export type CustomFieldType = "text" | "number" | "select";

export interface CustomFieldDef {
  key: string;
  label: string;
  type: CustomFieldType;
  /** Only for type === "select". */
  options?: string[];
  /** Optional unit hint, e.g. "kg/day". */
  unit?: string;
}

/** A Category defines its own custom fields, so the form and detail pages adapt to it. */
export interface Category {
  id: string;
  name: string;
  /** lucide-react icon name, resolved at render time. */
  icon: string;
  accentColor: string;
  customFields: CustomFieldDef[];
}

export interface Attachment {
  name: string;
  /** File extension, e.g. "pdf", "csv", "jpg". */
  type: string;
  /** Human-readable size, e.g. "2.4 MB". */
  size: string;
  /** Cloudinary delivery URL. */
  url?: string;
}

/** Points paid to one student when a problem was solved. */
export interface Reward {
  userId: string;
  points: number;
}

export interface OpenSlot {
  role: Role;
  count: number;
}

export type PilotStatus = "on-track" | "at-risk" | "completed";

export interface KpiPoint {
  week: number;
  value: number;
}

export interface KPI {
  name: string;
  currentValue: number;
  target: number;
  unit?: string;
  series: KpiPoint[];
}

export interface Pilot {
  id: string;
  problemId: string;
  status: PilotStatus;
  startDate: string;
  durationMonths: number;
  kpis: KPI[];
}

export interface Problem {
  id: string;
  title: string;
  categoryId: string;
  description: string;
  location: string;
  /** User.id of the industry account that posted it. */
  createdBy: string;
  customFieldValues: Record<string, string | number>;
  dataAttachments: Attachment[];
  proofAttachments: Attachment[];
  /** Points offered to the students who solve it. */
  rewardPoints: number;
  status: ProblemStatus;
  /** Filled in once the problem is solved. */
  rewards: Reward[];
  completedAt?: string;
  /** ISO date string. */
  createdAt: string;
}

export interface User {
  id: string;
  /** Company name for industry accounts. */
  name: string;
  /** Only present on your own profile. */
  email?: string;
  role: Role;
  /** Reward points earned (students). */
  points: number;
  initials?: string;
  avatarUrl?: string;
  skills?: string[];
}

export interface TeamMember {
  userId: string;
  role: Exclude<Role, "industry">;
}

export interface Team {
  id: string;
  problemId: string;
  members: TeamMember[];
  workspaceId: string;
  openSlots?: OpenSlot[];
}

export type TaskStatus = "todo" | "in-progress" | "done";

export interface Task {
  title: string;
  status: TaskStatus;
  /** userId of assignee. */
  assignee: string;
}

export interface SharedDoc {
  name: string;
  type: string;
  url?: string;
}

export interface Update {
  /** userId of author. */
  author: string;
  text: string;
  /** ISO date string. */
  at: string;
}

export interface Workspace {
  id: string;
  teamId: string;
  tasks: Task[];
  sharedDocs: SharedDoc[];
  updates: Update[];
}

