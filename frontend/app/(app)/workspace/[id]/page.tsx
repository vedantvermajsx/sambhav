"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  FileText,
  Circle,
  CircleDot,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { useData } from "@/lib/data-store";
import type { Task, TaskStatus, SharedDoc, Update, Workspace } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { uploadAccept, uploadFile } from "@/lib/cloudinary";
import { CategoryBadge } from "@/components/category-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const COLUMNS: { status: TaskStatus; icon: typeof Circle }[] = [
  { status: "todo", icon: Circle },
  { status: "in-progress", icon: CircleDot },
  { status: "done", icon: CheckCircle2 },
];

/** Runs an API call, showing the server's error message as a toast if it fails. */
async function attempt(action: () => Promise<unknown>, fallback: string) {
  try {
    await action();
    return true;
  } catch (err) {
    toast.error(err instanceof Error ? err.message : fallback);
    return false;
  }
}

export default function WorkspacePage({ params }: PageProps<"/workspace/[id]">) {
  const { id } = use(params);
  const { t } = useI18n();
  const { user } = useSession();
  const {
    getWorkspace,
    getTeam,
    getProblem,
    getCategory,
    getUser,
    updateWorkspaceTaskStatus,
    loading,
  } = useData();

  const workspace = getWorkspace(id);

  if (!workspace) {
    return loading ? (
      <div className="flex justify-center py-20">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    ) : (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-muted-foreground">{t("workspace.notFound")}</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard">{t("problem.backToDashboard")}</Link>
        </Button>
      </div>
    );
  }

  const team = getTeam(workspace.teamId);
  const problem = team ? getProblem(team.problemId) : undefined;
  const category = problem ? getCategory(problem.categoryId) : undefined;
  const isMember = !!team?.members.some((m) => m.userId === user?.id);
  const doneCount = workspace.tasks.filter((tk) => tk.status === "done").length;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={problem ? `/problems/${problem.id}` : "/dashboard"}
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("workspace.backToProblem")}
      </Link>

      <div className="flex flex-col gap-3">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          {t("workspace.title")}
        </h1>
        {problem && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-card p-3 ring-1 ring-foreground/10">
            {category && <CategoryBadge category={category} />}
            <span className="text-sm font-medium text-foreground">
              {problem.title}
            </span>
          </div>
        )}
        {!isMember && (
          <p className="text-sm text-muted-foreground">{t("workspace.readOnly")}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_20rem]">
        {/* Task board */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-medium text-foreground">
              {t("workspace.board")}
            </h2>
            <span className="text-sm text-muted-foreground">
              {t("workspace.taskSummary", {
                done: doneCount,
                total: workspace.tasks.length,
              })}
            </span>
          </div>

          {isMember && <AddTask workspaceId={workspace.id} />}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {COLUMNS.map(({ status, icon: Icon }) => {
              // Keep each task's index in the full list: the API addresses tasks by it.
              const tasks = workspace.tasks
                .map((task, index) => ({ task, index }))
                .filter(({ task }) => task.status === status);
              return (
                <div
                  key={status}
                  className="flex flex-col gap-2 rounded-xl bg-muted/40 p-3 ring-1 ring-foreground/5"
                >
                  <div className="flex items-center gap-1.5 px-1">
                    <Icon
                      className={
                        status === "done"
                          ? "size-4 text-success"
                          : status === "in-progress"
                            ? "size-4 text-primary"
                            : "size-4 text-muted-foreground"
                      }
                    />
                    <h3 className="text-sm font-medium text-foreground">
                      {t(`workspace.col.${status}`)}
                    </h3>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {tasks.length}
                    </span>
                  </div>
                  {tasks.length === 0 ? (
                    <p className="px-1 py-2 text-sm text-muted-foreground">
                      {t("workspace.noTasks")}
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {tasks.map(({ task, index }) => (
                        <TaskCard
                          key={index}
                          task={task}
                          canEdit={isMember}
                          onMove={(next) =>
                            attempt(
                              () => updateWorkspaceTaskStatus(workspace.id, index, next),
                              t("common.error")
                            )
                          }
                        />
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          <SharedDocs workspace={workspace} canEdit={isMember} />

          <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <h2 className="mb-3 font-heading text-base font-medium text-foreground">
              {t("workspace.updates")}
            </h2>
            {isMember && <UpdateComposer workspaceId={workspace.id} />}
            {workspace.updates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("workspace.noUpdates")}
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-4">
                {[...workspace.updates].reverse().map((update, i) => (
                  <UpdateRow key={`${update.at}-${i}`} update={update} getUser={getUser} />
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

/** Form to add a task to the board (assigned to the person adding it). */
function AddTask({ workspaceId }: { workspaceId: string }) {
  const { t } = useI18n();
  const { addWorkspaceTask } = useData();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    if (await attempt(() => addWorkspaceTask(workspaceId, title), t("common.error"))) {
      setTitle("");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t("workspace.newTask")}
        aria-label={t("workspace.newTask")}
      />
      <Button type="submit" disabled={!title.trim() || busy}>
        <Plus />
        {t("workspace.addTask")}
      </Button>
    </form>
  );
}

/** Composer for a progress update. */
function UpdateComposer({ workspaceId }: { workspaceId: string }) {
  const { t } = useI18n();
  const { addWorkspaceUpdate } = useData();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    if (await attempt(() => addWorkspaceUpdate(workspaceId, text), t("common.error"))) {
      setText("");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <Textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("workspace.updatePlaceholder")}
        aria-label={t("workspace.updatePlaceholder")}
      />
      <Button type="submit" size="sm" className="self-end" disabled={!text.trim() || busy}>
        {t("workspace.postUpdate")}
      </Button>
    </form>
  );
}

/** Shared documents, with an upload button (team members) that stores the file on Cloudinary. */
function SharedDocs({
  workspace,
  canEdit,
}: {
  workspace: Workspace;
  canEdit: boolean;
}) {
  const { t } = useI18n();
  const { addWorkspaceDoc } = useData();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const { name, type, url } = await uploadFile(file, "workspace");
      await addWorkspaceDoc(workspace.id, { name, type, url });
      toast.success(t("workspace.docAdded"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("upload.failed"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-heading text-base font-medium text-foreground">
          {t("workspace.docs")}
        </h2>
        {canEdit && (
          <>
            <input
              ref={input}
              type="file"
              accept={uploadAccept("workspace")}
              className="hidden"
              onChange={handleFile}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => input.current?.click()}
            >
              {uploading ? (
                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Plus />
              )}
              {uploading ? t("upload.uploading") : t("workspace.addDoc")}
            </Button>
          </>
        )}
      </div>
      {workspace.sharedDocs.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("workspace.noDocs")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {workspace.sharedDocs.map((doc, i) => (
            <DocRow key={`${doc.name}-${i}`} doc={doc} />
          ))}
        </ul>
      )}
    </section>
  );
}

/** One task: title, assignee, and (for team members) buttons to move it. */
function TaskCard({
  task,
  canEdit,
  onMove,
}: {
  task: Task;
  canEdit: boolean;
  onMove: (status: TaskStatus) => void;
}) {
  const { t } = useI18n();
  const { getUser } = useData();
  const assignee = getUser(task.assignee);
  return (
    <li className="flex flex-col gap-2 rounded-lg bg-card p-3 ring-1 ring-foreground/10">
      <p className="text-sm text-foreground">{task.title}</p>
      <div className="flex items-center gap-1.5">
        <UserAvatar
          className="size-5"
          textClassName="text-xs"
          src={assignee?.avatarUrl}
          initials={assignee?.initials ?? "?"}
        />
        <span className="text-xs text-muted-foreground">{assignee?.name}</span>
      </div>
      {canEdit && (
        <div className="flex flex-wrap gap-1.5">
          {COLUMNS.filter((c) => c.status !== task.status).map((c) => (
            <Button
              key={c.status}
              variant="outline"
              size="xs"
              onClick={() => onMove(c.status)}
            >
              {t(`workspace.col.${c.status}`)}
            </Button>
          ))}
        </div>
      )}
    </li>
  );
}

function DocRow({ doc }: { doc: SharedDoc }) {
  const row = (
    <>
      <FileText className="size-4 shrink-0 text-primary" />
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
        {doc.name}
      </span>
      <span className="shrink-0 text-xs uppercase text-muted-foreground">
        {doc.type}
      </span>
    </>
  );
  const className = "flex items-center gap-2.5 rounded-lg bg-muted px-3 py-2";
  return (
    <li>
      {doc.url ? (
        <a
          href={doc.url}
          target="_blank"
          rel="noreferrer"
          className={`${className} transition-colors hover:bg-muted/70`}
        >
          {row}
        </a>
      ) : (
        <div className={className}>{row}</div>
      )}
    </li>
  );
}

/** One activity update: author, text, date. */
function UpdateRow({
  update,
  getUser,
}: {
  update: Update;
  getUser: (id: string) => { name: string; initials?: string; avatarUrl?: string } | undefined;
}) {
  const { lang } = useI18n();
  const author = getUser(update.author);
  return (
    <li className="flex gap-3">
      <UserAvatar
        className="size-8 shrink-0"
        textClassName="text-xs"
        src={author?.avatarUrl}
        initials={author?.initials ?? "?"}
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-foreground">{author?.name}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(update.at).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", {
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>
        <p className="text-sm break-words text-foreground/90">{update.text}</p>
      </div>
    </li>
  );
}
