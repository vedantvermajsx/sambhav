"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Wraps the app with light/dark theming. Uses the `class` strategy so the
 * `.dark` palette already defined in globals.css just works. `system` default
 * follows the visitor's OS; the header toggle overrides and persists it.
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
