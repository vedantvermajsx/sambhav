import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { DataProvider } from "@/lib/data-store";
import { SessionProvider } from "@/lib/session";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Sambhav — where community problems meet their solvers",
  description:
    "A domain-agnostic platform connecting verified community problems with students, researchers, and industry.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="font-sans h-full antialiased"
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <DataProvider>
              <SessionProvider>
                {children}
                <Toaster position="top-center" />
              </SessionProvider>
            </DataProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

