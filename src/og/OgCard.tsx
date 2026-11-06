import { site, skillGroups } from "@/data/config";
import { toneClass } from "@/lib/tone";
import { cn } from "@/lib/utils";
import OrbitFallback from "@/components/hero/OrbitFallback";
import { OrbitMark } from "@/components/OrbitMark";

/** 1200×630 social card, rendered from the same data + SVG orbit as the hero. */
export default function OgCard() {
  return (
    <div id="og" className="relative flex h-[630px] w-[1200px] items-center overflow-hidden bg-bg px-20">
      <div className="relative z-10 w-[640px]">
        <p className="label-mono flex items-center gap-3 text-sm">
          <span className="text-cyan">{site.coords}</span>
          <span className="h-px w-8 bg-line" />
          {site.location}
        </p>
        <h1 className="mt-6 font-display text-[84px] font-semibold leading-[1.02] tracking-[-0.035em] text-ink">{site.name}</h1>
        <p className="mt-5 font-display text-[34px] font-medium text-ink-2">
          {site.role}
          <span className="text-cyan">.</span>
        </p>
        <ul className="mt-10 flex flex-wrap gap-2.5">
          {skillGroups.map((g) => (
            <li key={g.id} className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 font-mono text-[15px] text-ink-2">
              <span className={cn("h-2 w-2 rounded-full", toneClass[g.tone].bg)} />
              {g.label}
            </li>
          ))}
        </ul>
      </div>
      <div className="absolute right-[-40px] top-1/2 h-[600px] w-[600px] -translate-y-1/2">
        <OrbitFallback />
      </div>
      <div className="absolute bottom-10 left-20 flex items-center gap-2.5 font-display text-lg font-semibold text-ink">
        <OrbitMark className="h-6 w-6 text-cyan" />
        <span>
          {site.shortName}
          <span className="text-cyan">.</span>
        </span>
        {site.url && <span className="ml-3 font-mono text-sm font-normal text-ink-3">{site.url.replace(/^https?:\/\//, "")}</span>}
      </div>
    </div>
  );
}
