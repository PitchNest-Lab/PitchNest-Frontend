import React from "react";
import { cn } from "../../lib/utils";

/**
 * Marks an example profile: a sample that shows what a complete business page
 * looks like. Examples are listed after real businesses.
 */
export function ExampleBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="An example profile that shows what a complete PitchNest business page looks like"
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
        className,
      )}
    >
      Example
    </span>
  );
}
