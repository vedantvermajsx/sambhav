"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  FlaskConical,
  Factory,
  ShieldCheck,
  Users,
  Trophy,
  Check,
} from "lucide-react";
import type { Role } from "@/lib/types";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { LangToggle } from "@/components/lang-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Mode = "signin" | "register";

const ROLES: { role: Role; icon: typeof GraduationCap }[] = [
  { role: "student", icon: GraduationCap },
  { role: "researcher", icon: FlaskConical },
  { role: "industry", icon: Factory },
];

const PITCH = [
  { key: "login.pitch.1", icon: ShieldCheck },
  { key: "login.pitch.2", icon: Users },
  { key: "login.pitch.3", icon: Trophy },
];

export default function LoginPage() {
  const router = useRouter();
  const { user, ready, login, register } = useSession();
  const { t } = useI18n();

  const [mode, setMode] = useState<Mode>("signin");
  const [role, setRole] = useState<Role>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // Already signed in — go straight to the app.
  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, user, router]);

  const registering = mode === "register";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!email.trim() || !password || (registering && !name.trim())) {
      toast.error(t("login.error.fields"));
      return;
    }
    if (registering && password.length < 8) {
      toast.error(t("login.password.hint"));
      return;
    }
    setBusy(true);
    try {
      if (registering) {
        await register({ name: name.trim(), email: email.trim(), password, role });
      } else {
        await login(email.trim(), password);
      }
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("login.error.generic"));
      setBusy(false);
    }
  }

  return (
    <main className="relative flex flex-1 flex-col lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <ThemeToggle />
        <LangToggle />
      </div>

      {/* Branded pitch panel */}
      <section className="flex flex-col justify-between bg-primary px-8 py-10 text-primary-foreground sm:px-12 lg:py-14">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary-foreground text-sm font-semibold text-primary">
            सं
          </span>
          <span className="font-heading text-lg font-semibold">
            {t("brand.name")}
          </span>
        </div>

        <div className="my-10 max-w-md">
          <h1 className="font-heading text-3xl leading-tight font-semibold sm:text-4xl">
            {t("login.pitch.headline")}
          </h1>
          <ul className="mt-6 space-y-3">
            {PITCH.map(({ key, icon: Icon }) => (
              <li
                key={key}
                className="flex items-center gap-3 text-sm text-primary-foreground/90"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
                  <Icon className="size-4" />
                </span>
                {t(key)}
              </li>
            ))}
          </ul>
        </div>

        <div />
      </section>

      {/* Sign in / create account */}
      <section className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <form onSubmit={submit} className="w-full max-w-md" noValidate>
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(["signin", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  mode === m
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t(`login.tab.${m}`)}
              </button>
            ))}
          </div>

          <h2 className="font-heading text-2xl font-semibold text-foreground">
            {t(`login.title.${mode}`)}
          </h2>
          <p className="mt-1 mb-6 text-muted-foreground">
            {t(`login.subtitle.${mode}`)}
          </p>

          {registering && (
            <div className="mb-5">
              <p className="mb-2 text-sm font-medium text-foreground">
                {t("login.pickRole")}
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {ROLES.map(({ role: r, icon: Icon }) => {
                  const active = role === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      aria-pressed={active}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl bg-card p-3 text-left ring-1 transition-colors",
                        active
                          ? "ring-2 ring-primary"
                          : "ring-foreground/10 hover:ring-foreground/25"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        <Icon className="size-5" />
                      </span>
                      <span className="flex-1">
                        <span className="block font-heading text-sm font-medium text-foreground">
                          {t(`role.${r}`)}
                        </span>
                        <span className="block text-sm text-muted-foreground">
                          {t(`login.role.${r}.desc`)}
                        </span>
                      </span>
                      {active && <Check className="size-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {registering && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">
                  {t(role === "industry" ? "login.field.company" : "login.field.name")}
                </Label>
                <Input
                  id="name"
                  autoComplete={role === "industry" ? "organization" : "name"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">{t("login.field.email")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">{t("login.field.password")}</Label>
              <Input
                id="password"
                type="password"
                autoComplete={registering ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {registering && (
                <p className="text-sm text-muted-foreground">
                  {t("login.password.hint")}
                </p>
              )}
            </div>
          </div>

          <Button type="submit" size="lg" disabled={busy} className="mt-6 w-full">
            {busy && (
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {t(`login.submit.${mode}`)}
          </Button>
        </form>
      </section>
    </main>
  );
}
