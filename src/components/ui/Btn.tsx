import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "fill" | "ghost" | "white" | "dark";
type Common = { variant?: Variant; size?: "md" | "sm"; children: ReactNode; className?: string };

// literal class names so Tailwind's content scan keeps them
const VARIANT: Record<Variant, string> = { fill: "btn--fill", ghost: "btn--ghost", white: "btn--white", dark: "btn--dark" };
const TONE = { up: "chip--up", cyan: "chip--cyan" } as const;

const classes = (variant: Variant, size: "md" | "sm", className?: string) =>
  cn("btn", VARIANT[variant], size === "sm" && "btn--sm", className);

/** Magnetic button rendered as a link (label moves a little further than the body → depth). */
export function BtnLink({ variant = "fill", size = "md", children, className, ...props }: Common & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a data-magnetic className={classes(variant, size, className)} {...props}>
      <span className="btn__label">{children}</span>
    </a>
  );
}

export function Btn({ variant = "fill", size = "md", children, className, type = "button", ...props }: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button data-magnetic type={type} className={classes(variant, size, className)} {...props}>
      <span className="btn__label">{children}</span>
    </button>
  );
}

export function Chip({ children, tone, live, className }: { children: ReactNode; tone?: "up" | "cyan"; live?: boolean; className?: string }) {
  return <span className={cn("chip", tone && TONE[tone], live && "chip--live", className)}>{children}</span>;
}

/** Text link with a sliding arrow. */
export function ArrowLink({ children, className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) {
  return (
    <a className={cn("arrow-link", className)} {...props}>
      {children}
      <svg viewBox="0 0 16 16" aria-hidden>
        <path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}

/** Section eyebrow: "01 — LABEL" in mono. */
export function Eyebrow({ index, children, className }: { index: string; children: ReactNode; className?: string }) {
  return (
    <p className={cn("eyebrow", className)}>
      <span className="eyebrow__index">{index}</span>
      <span aria-hidden className="eyebrow__rule" />
      {children}
    </p>
  );
}
