"use client";

// The signed-in person. Sign-in and sign-up talk to the backend's JWT auth;
// the token is kept in localStorage and checked again on every page load.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Role, User } from "@/lib/types";
import { fetchMe, loginUser, registerUser, updateMyAvatar } from "@/lib/data";
import { useData } from "@/lib/data-store";
import { getToken, setToken, clearToken } from "@/lib/api";

interface SessionValue {
  user: User | null;
  role: Role | null;
  /** True once the stored token has been checked (avoids a flash of the login page). */
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    role: Role;
  }) => Promise<void>;
  logout: () => void;
  /** Saves an uploaded Cloudinary image URL as the signed-in user's photo. */
  updateAvatar: (avatarUrl: string) => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const { patchUser } = useData();

  // On load, check any stored token against the backend.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (getToken()) {
        try {
          const profile = await fetchMe();
          if (!cancelled) setUser(profile);
        } catch {
          clearToken();
        }
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const start = useCallback(
    (auth: { token: string; user: User }) => {
      setToken(auth.token);
      setUser(auth.user);
      patchUser(auth.user);
    },
    [patchUser]
  );

  const login = useCallback(
    async (email: string, password: string) => start(await loginUser(email, password)),
    [start]
  );

  const register = useCallback<SessionValue["register"]>(
    async (payload) => start(await registerUser(payload)),
    [start]
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const updateAvatar = useCallback(
    async (avatarUrl: string) => {
      const updated = await updateMyAvatar(avatarUrl);
      setUser(updated);
      patchUser(updated);
    },
    [patchUser]
  );

  return (
    <SessionContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        ready,
        login,
        register,
        logout,
        updateAvatar,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
