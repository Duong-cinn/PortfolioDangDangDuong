import { useId } from "react";
import { projects, skillGroups, type SkillGroup } from "@/data/config";
import { toneClass } from "@/lib/tone";
import { cn } from "@/lib/utils";

/**
 * Static, data-driven SVG of the Digital Orbit object.
 * - Rings  = skill groups (innermost first)
 * - Nodes  = skills inside each group
 * - Satellites = featured projects
 * Used as the no-WebGL / reduced-motion fallback and as the placeholder
 * shown before the lazy 3D chunk loads (Phase 2). Same box → zero CLS.
 */

const C = 200; // viewBox center
const TILT = [-18, 26, -52, 10];
const SQUASH = [0.34, 0.42, 0.3, 0.5];

type Ring = { group: SkillGroup; rx: number; ry: number; rot: number };

const rings: Ring[] = skillGroups.map((group, i) => {
  const rx = 104 + i * 26;
  return { group, rx, ry: rx * SQUASH[i % SQUASH.length], rot: TILT[i % TILT.length] };
});

function nodePositions(ring: Ring, count: number, offset: number) {
  return Array.from({ length: count }, (_, k) => {
    const t = offset + (k / count) * Math.PI * 2;
    return { x: C + ring.rx * Math.cos(t), y: C + ring.ry * Math.sin(t), front: Math.sin(t) > 0 };
  });
}

function RingPath({ ring, half, clipId }: { ring: Ring; half: "back" | "front"; clipId: string }) {
  const tone = toneClass[ring.group.tone];
  const dotted = ring.group.tone === "dotted";
  return (
    <g transform={`rotate(${ring.rot} ${C} ${C})`} clipPath={`url(#${clipId}-${half})`}>
      <ellipse
        cx={C}
        cy={C}
        rx={ring.rx}
        ry={ring.ry}
        fill="none"
        className={tone.stroke}
        strokeWidth={dotted ? 1.4 : 1.1}
        strokeDasharray={dotted ? "1 6" : undefined}
        strokeLinecap="round"
        opacity={half === "back" ? 0.28 : 0.75}
      />
    </g>
  );
}

export default function OrbitFallback({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");

  return (
    <svg viewBox="0 0 400 400" className={cn("h-full w-full overflow-visible", className)} aria-hidden>
      <defs>
        <radialGradient id={`${uid}-core`} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="rgb(var(--metal-1))" stopOpacity="0.95" />
          <stop offset="45%" stopColor="rgb(var(--metal-2))" stopOpacity="0.85" />
          <stop offset="100%" stopColor="rgb(var(--bg))" stopOpacity="1" />
        </radialGradient>
        <radialGradient id={`${uid}-halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgb(var(--violet))" stopOpacity="0.22" />
          <stop offset="100%" stopColor="rgb(var(--violet))" stopOpacity="0" />
        </radialGradient>
        {rings.map((_, i) => (
          <g key={i}>
            <clipPath id={`${uid}-r${i}-back`} clipPathUnits="userSpaceOnUse">
              <rect x="0" y="0" width="400" height={C} />
            </clipPath>
            <clipPath id={`${uid}-r${i}-front`} clipPathUnits="userSpaceOnUse">
              <rect x="0" y={C} width="400" height={C} />
            </clipPath>
          </g>
        ))}
      </defs>

      {/* ambient halo */}
      <circle cx={C} cy={C} r="190" fill={`url(#${uid}-halo)`} />

      {/* back halves of rings + back nodes */}
      {rings.map((ring, i) => (
        <g key={`b${i}`}>
          <RingPath ring={ring} half="back" clipId={`${uid}-r${i}`} />
          <g transform={`rotate(${ring.rot} ${C} ${C})`}>
            {nodePositions(ring, ring.group.items.length, i * 0.9)
              .filter((p) => !p.front)
              .map((p, k) => (
                <circle key={k} cx={p.x} cy={p.y} r="2.6" className={toneClass[ring.group.tone].fill} opacity="0.4" />
              ))}
          </g>
        </g>
      ))}

      {/* core: metal sphere + inner AI lattice */}
      <circle cx={C} cy={C} r="64" fill={`url(#${uid}-core)`} />
      <circle cx={C} cy={C} r="64" fill="none" className="stroke-cyan" strokeOpacity="0.35" strokeWidth="1" />
      <g className="stroke-violet" strokeWidth="0.8" strokeOpacity="0.55" fill="none">
        <polygon points="200,168 230,190 219,226 181,226 170,190" />
        <path d="M200 168 L200 200 M230 190 L200 200 M219 226 L200 200 M181 226 L200 200 M170 190 L200 200" />
      </g>
      <ellipse cx="184" cy="176" rx="18" ry="9" fill="white" opacity="0.12" transform="rotate(-30 184 176)" />

      {/* front halves of rings + front nodes */}
      {rings.map((ring, i) => (
        <g key={`f${i}`}>
          <RingPath ring={ring} half="front" clipId={`${uid}-r${i}`} />
          <g transform={`rotate(${ring.rot} ${C} ${C})`}>
            {nodePositions(ring, ring.group.items.length, i * 0.9)
              .filter((p) => p.front)
              .map((p, k) => (
                <circle key={k} cx={p.x} cy={p.y} r="3.2" className={toneClass[ring.group.tone].fill} />
              ))}
          </g>
        </g>
      ))}

      {/* satellites = projects (none rendered while projects[] is empty) */}
      {projects.slice(0, 5).map((p, k) => {
        const a = -0.6 + k * 1.25;
        const r = 182;
        return (
          <rect
            key={p.title}
            x={C + r * Math.cos(a) - 4}
            y={C + r * Math.sin(a) * 0.6 - 4}
            width="8"
            height="8"
            transform={`rotate(45 ${C + r * Math.cos(a)} ${C + r * Math.sin(a) * 0.6})`}
            className="fill-ink"
            opacity="0.85"
          />
        );
      })}
    </svg>
  );
}
