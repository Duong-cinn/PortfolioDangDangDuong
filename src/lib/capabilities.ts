type NavigatorExtras = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

/**
 * Should the hero load the 3D chunk at all?
 * No → the static SVG orbit stays (it carries the same information).
 */
export function canRender3D(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;

  const nav = navigator as NavigatorExtras;
  if (nav.connection?.saveData) return false;
  if ((nav.deviceMemory ?? 8) <= 2) return false;
  if ((nav.hardwareConcurrency ?? 8) <= 2) return false;
  if (new URLSearchParams(window.location.search).has("static")) return false;

  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Run `fn` after the load event, when the main thread is idle. Returns a cancel function. */
export function whenIdleAfterLoad(fn: () => void, timeout = 1500): () => void {
  let cancelled = false;
  let idleId: number | undefined;
  let timer: number | undefined;

  const schedule = () => {
    if (cancelled) return;
    if (typeof window.requestIdleCallback === "function") idleId = window.requestIdleCallback(() => !cancelled && fn(), { timeout });
    else timer = window.setTimeout(() => !cancelled && fn(), 1200);
  };

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });

  return () => {
    cancelled = true;
    window.removeEventListener("load", schedule);
    if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
    if (timer !== undefined) window.clearTimeout(timer);
  };
}
