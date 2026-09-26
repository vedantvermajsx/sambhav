"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { LayoutGrid, PlusCircle, Award, LogOut, Camera, Trophy } from "lucide-react";
import type { Role } from "@/lib/types";
import { useSession } from "@/lib/session";
import { useData } from "@/lib/data-store";
import { useI18n } from "@/lib/i18n";
import { uploadAccept, uploadFile } from "@/lib/cloudinary";
import { LangToggle } from "@/components/lang-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar } from "@/components/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// `roles` limits a link to those roles; no `roles` means everyone.
const NAV: {
  href: string;
  key: string;
  icon: typeof LayoutGrid;
  roles?: Role[];
}[] = [
  { href: "/dashboard", key: "nav.dashboard", icon: LayoutGrid },
  { href: "/submit", key: "nav.submit", icon: PlusCircle, roles: ["industry"] },
  { href: "/incentives", key: "nav.incentives", icon: Award, roles: ["student"] },
];

export function AppHeader() {
  const { user, role, logout, updateAvatar } = useSession();
  const { getUser } = useData();
  const { t } = useI18n();
  const nav = NAV.filter((n) => !n.roles || (role && n.roles.includes(role)));
  // The data cache is refreshed more often than the session, so it has the latest points.
  const points = (user && getUser(user.id)?.points) ?? user?.points ?? 0;
  const pathname = usePathname();
  const router = useRouter();
  // Lives outside the dropdown: the menu unmounts on select, which would
  // discard the file before the picker returns.
  const photoInput = useRef<HTMLInputElement>(null);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    toast.promise(
      uploadFile(file, "avatar").then((uploaded) => updateAvatar(uploaded.url)),
      {
        loading: t("upload.uploading"),
        success: t("profile.photoUpdated"),
        error: (err) => (err instanceof Error ? err.message : t("upload.failed")),
      }
    );
  }

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="font-heading text-sm font-semibold">सं</span>
          </span>
          <span className="font-heading text-lg font-semibold text-foreground">
            {t("brand.name")}
          </span>
        </Link>

        {/* Primary nav */}
        <nav className="ml-2 hidden items-center gap-1 sm:flex">
          {nav.map(({ href, key, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {t(key)}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {role === "student" && (
            <Link
              href="/incentives"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary"
            >
              <Trophy className="size-4" />
              {t("common.points", { count: points })}
            </Link>
          )}
          <ThemeToggle />
          <LangToggle />
          {user && (
            <>
              <input
                ref={photoInput}
                type="file"
                accept={uploadAccept("avatar")}
                className="hidden"
                onChange={handlePhoto}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                    <UserAvatar
                      className="size-8"
                      src={user.avatarUrl}
                      initials={user.initials ?? user.name.slice(0, 2).toUpperCase()}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {role && t(`role.${role}`)}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => photoInput.current?.click()}>
                    <Camera className="size-4" />
                    {t("profile.changePhoto")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="size-4" />
                    {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex items-center gap-1 border-t border-border px-2 py-1.5 sm:hidden">
        {nav.map(({ href, key, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "inline-flex flex-1 flex-col items-center gap-0.5 rounded-md py-1 text-xs font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="size-4" />
              {t(key)}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
