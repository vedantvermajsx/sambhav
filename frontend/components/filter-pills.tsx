"use client";

import { cn } from "@/lib/utils";

export interface PillOption {
  value: string;
  label: string;
}

/**
 * A horizontal row of selectable pills — a friendlier replacement for a
 * dropdown when the option set is small. Single-select. The active pill fills
 * with the primary color; the rest stay quiet until hovered.
 */
export function FilterPills({
  options,
  value,
  onChange,
  label,
}: {
  options: PillOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
      )}
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition-colors",
                active
                  ? "bg-primary text-primary-foreground ring-transparent"
                  : "bg-card text-muted-foreground ring-foreground/10 hover:text-foreground hover:ring-foreground/25"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
