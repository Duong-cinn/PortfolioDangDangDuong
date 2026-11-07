import { useEffect, useRef } from "react";
import { site, skillGroups } from "@/data/config";
import type { Pose } from "@/three/spaceScene";

/** Ship pose for the social card (same scene as the hero, framed for 1200×630). */
const OG_POSE: Pose = { x: 0.44, y: 0.04, s: 0.78, yaw: -0.62, pitch: 0.2, roll: -0.42 };

/**
 * 1200×630 social card: the real WebGL scene (ship, planets, data sea) as the backdrop,
 * name + role + skill groups in HUD style on top. Rendered by `npm run og`.
 */
export default function OgCard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let dispose: (() => void) | undefined;
    import("@/three/spaceScene").then(({ createSpaceScene }) => {
      if (!canvasRef.current) return;
      dispose = createSpaceScene({
        canvas: canvasRef.current,
        measure: () => ({ stops: [{ at: 0, pose: OG_POSE }], endTop: Infinity }),
        onReady: () => document.documentElement.setAttribute("data-og-ready", "1"),
        onFail: () => undefined,
      })?.dispose;
    });
    return () => dispose?.();
  }, []);

  return (
    <>
    <div id="og" className="og">
      <div className="scene-layer scene-hero">
        <div className="scene-grid" />
      </div>
      <canvas ref={canvasRef} className="og__canvas" />

      <div className="og__text">
        <p className="og__meta">
          <span className="text-cyan">{site.coords}</span>
          <span className="og__rule" />
          {site.location}
        </p>
        <h1 className="og__name">{site.name}</h1>
        <p className="og__role">
          {site.role}
          <span className="text-cyan">.</span>
        </p>
        <ul className="og__chips">
          {skillGroups.map((g) => (
            <li key={g.id}>{g.label}</li>
          ))}
        </ul>
      </div>

      <div className="og__brand">
        <span className="orb" />
        <span>
          {site.shortName}
          <span className="text-cyan">.</span>
        </span>
        {site.url && <span className="og__url">{site.url.replace(/^https?:\/\//, "")}</span>}
      </div>
    </div>
    {/* page length so the planets sit at their hero positions (they are placed by scroll progress) */}
    <div aria-hidden style={{ height: 5000 }} />
    </>
  );
}

/** 180×180 apple-touch-icon: the orb mark on the page background. */
export function AppIcon() {
  return (
    <div className="og-icon">
      <span className="orb" />
    </div>
  );
}
