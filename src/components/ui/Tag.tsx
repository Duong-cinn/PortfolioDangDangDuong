import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Tag({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/60 px-3 py-1 font-mono text-xs text-ink-2",
        className,
      )}
      {...props}
    />
  );
}
