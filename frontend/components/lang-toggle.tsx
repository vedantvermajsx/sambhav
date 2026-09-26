"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

/** English ⇄ Hindi switch for UI chrome. Label shows the OTHER language. */
export function LangToggle({ className }: { className?: string }) {
  const { t, toggleLang } = useI18n();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLang}
      className={className}
      aria-label={t("lang.toggle")}
    >
      <Languages />
      {t("lang.toggle")}
    </Button>
  );
}
