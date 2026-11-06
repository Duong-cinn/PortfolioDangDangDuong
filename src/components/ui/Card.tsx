import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const cardClass = "rounded-lg border border-line bg-surface shadow-elev";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(cardClass, className)} {...props} />;
}
