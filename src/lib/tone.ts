import type { RingTone } from "@/data/config";

/** Literal class strings per ring tone (kept literal so Tailwind can see them). */
export const toneClass: Record<RingTone, { text: string; bg: string; stroke: string; fill: string; border: string }> = {
  cyan: { text: "text-cyan", bg: "bg-cyan", stroke: "stroke-cyan", fill: "fill-cyan", border: "border-cyan/60" },
  violet: { text: "text-violet", bg: "bg-violet", stroke: "stroke-violet", fill: "fill-violet", border: "border-violet/60" },
  gray: { text: "text-ink-2", bg: "bg-ink-2", stroke: "stroke-ink-2", fill: "fill-ink-2", border: "border-ink-2/50" },
  dotted: { text: "text-ink-3", bg: "bg-ink-3", stroke: "stroke-ink-3", fill: "fill-ink-3", border: "border-ink-3/50" },
};
