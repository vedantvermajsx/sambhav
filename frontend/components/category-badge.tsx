import type { Category } from "@/lib/types";
import { CategoryIcon } from "@/components/category-icon";
import { cn } from "@/lib/utils";

/**
 * Category pill: the category's own accent as a light tint, with the text
 * darkened (or lightened in dark mode) so it stays readable for any accent.
 */
export function CategoryBadge({
  category,
  className,
}: {
  category: Category;
  className?: string;
}) {
  return (
    <span
      style={{ "--cat": category.accentColor } as React.CSSProperties}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        "bg-[color-mix(in_oklch,var(--cat),transparent_88%)]",
        "text-[color-mix(in_oklch,var(--cat),black_35%)] dark:text-[color-mix(in_oklch,var(--cat),white_30%)]",
        className
      )}
    >
      <CategoryIcon name={category.icon} className="size-3.5" />
      {category.name}
    </span>
  );
}
