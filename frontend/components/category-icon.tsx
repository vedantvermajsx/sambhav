"use client";

import { icons, HelpCircle, type LucideProps } from "lucide-react";

/**
 * Resolve a lucide icon by its string name (categories store icon names as
 * data, keeping the domain model serializable and free of React imports).
 * Falls back to a neutral icon if the name is unknown.
 */
export function CategoryIcon({
  name,
  ...props
}: { name: string } & LucideProps) {
  const Icon = (icons as Record<string, React.ComponentType<LucideProps>>)[
    name
  ];
  const Resolved = Icon ?? HelpCircle;
  return <Resolved {...props} />;
}
