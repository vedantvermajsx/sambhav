"use client";

// Client-side cache of the Sambhav data. Every list is fetched once when the
// app loads (and again when the tab regains focus); pages read it through
// useData(). Mutations call the API, then patch the cache from the response.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Category,
  Problem,
  SharedDoc,
  TaskStatus,
  Team,
  User,
  Workspace,
} from "@/lib/types";
import * as api from "@/lib/data";

interface DataValue {
  /** True only during the very first load. */
  loading: boolean;
  error: string | null;
  /** Reloads everything in the background. */
  refetch: () => Promise<void>;

  getCategories: () => Category[];
  getCategory: (id: string) => Category | undefined;

  getProblems: () => Problem[];
  getProblem: (id: string) => Problem | undefined;
  createProblem: (payload: api.NewProblem) => Promise<Problem>;
  /** Joins (and if needed creates) the problem's team. Returns the workspace to open. */
  joinProblem: (problemId: string) => Promise<Workspace>;
  /** Marks a problem solved; reward points are paid out by the server. */
  completeProblem: (problemId: string) => Promise<Problem>;

  getUsers: () => User[];
  getUser: (id: string) => User | undefined;
  /** Replaces (or adds) a user in the cache, e.g. after sign-in or a new avatar. */
  patchUser: (user: User) => void;

  getTeam: (id: string) => Team | undefined;
  getTeamByProblem: (problemId: string) => Team | undefined;

  getWorkspace: (id: string) => Workspace | undefined;
  addWorkspaceTask: (workspaceId: string, title: string) => Promise<void>;
  updateWorkspaceTaskStatus: (
    workspaceId: string,
    taskIndex: number,
    status: TaskStatus
  ) => Promise<void>;
  addWorkspaceUpdate: (workspaceId: string, text: string) => Promise<void>;
  addWorkspaceDoc: (workspaceId: string, doc: SharedDoc) => Promise<void>;
}

const DataContext = createContext<DataValue | null>(null);

const fetchAll = () =>
  Promise.all([
    api.fetchCategories(),
    api.fetchProblems(),
    api.fetchUsers(),
    api.fetchTeams(),
    api.fetchWorkspaces(),
  ]);

/** Replaces the item with the same id, or adds it at the front. */
function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  return list.some((x) => x.id === item.id)
    ? list.map((x) => (x.id === item.id ? item : x))
    : [item, ...list];
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyAll = useCallback(
    ([cats, probs, usrs, tms, wss]: Awaited<ReturnType<typeof fetchAll>>) => {
      setCategories(cats);
      setProblems(probs);
      setUsers(usrs);
      setTeams(tms);
      setWorkspaces(wss);
      setError(null);
    },
    []
  );

  const refetch = useCallback(async () => {
    try {
      applyAll(await fetchAll());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [applyAll]);

  useEffect(() => {
    let active = true;
    fetchAll()
      .then((data) => active && applyAll(data))
      .catch(
        (err) =>
          active &&
          setError(err instanceof Error ? err.message : "Failed to load data")
      )
      .finally(() => active && setLoading(false));

    // Pick up changes made by other people (new problems, points) when the
    // person comes back to this tab.
    const onFocus = () => void refetch();
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      window.removeEventListener("focus", onFocus);
    };
  }, [applyAll, refetch]);

  const value = useMemo<DataValue>(() => {
    const setWorkspace = (ws: Workspace) =>
      setWorkspaces((prev) => upsert(prev, ws));

    return {
      loading,
      error,
      refetch,

      getCategories: () => categories,
      getCategory: (id) => categories.find((c) => c.id === id),

      getProblems: () => problems,
      getProblem: (id) => problems.find((p) => p.id === id),
      createProblem: async (payload) => {
        const created = await api.createProblem(payload);
        setProblems((prev) => upsert(prev, created));
        return created;
      },
      joinProblem: async (problemId) => {
        const { problem, team, workspace } = await api.joinProblem(problemId);
        setProblems((prev) => upsert(prev, problem));
        setTeams((prev) => upsert(prev, team));
        setWorkspace(workspace);
        return workspace;
      },
      completeProblem: async (problemId) => {
        const solved = await api.completeProblem(problemId);
        setProblems((prev) => upsert(prev, solved));
        await refetch(); // students' point totals changed
        return solved;
      },

      getUsers: () => users,
      getUser: (id) => users.find((u) => u.id === id),
      patchUser: (user) => setUsers((prev) => upsert(prev, user)),

      getTeam: (id) => teams.find((t) => t.id === id),
      getTeamByProblem: (problemId) => teams.find((t) => t.problemId === problemId),

      getWorkspace: (id) => workspaces.find((w) => w.id === id),
      addWorkspaceTask: async (workspaceId, title) =>
        setWorkspace(await api.addWorkspaceTask(workspaceId, { title })),
      updateWorkspaceTaskStatus: async (workspaceId, taskIndex, status) =>
        setWorkspace(
          await api.updateWorkspaceTaskStatus(workspaceId, taskIndex, status)
        ),
      addWorkspaceUpdate: async (workspaceId, text) =>
        setWorkspace(await api.addWorkspaceUpdate(workspaceId, text)),
      addWorkspaceDoc: async (workspaceId, doc) =>
        setWorkspace(await api.addWorkspaceDoc(workspaceId, doc)),
    };
  }, [loading, error, refetch, categories, problems, users, teams, workspaces]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
