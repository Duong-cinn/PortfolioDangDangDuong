/** Deterministic pseudo-random series for decorative sparklines (same output on server and client). */
export function series(n: number, seed: number, base: number, amp: number, trend: number) {
  let s = seed * 1000 + 7;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: n }, (_, i) => base + (trend * i) / (n - 1) + Math.sin(i * 0.9 + seed) * amp * 0.5 + (rnd() - 0.5) * amp);
}

/** Smooth cubic path through points: control points at (mid-x, q.y) and (mid-x, p.y). */
export function smoothPath(points: [number, number][]) {
  return points.reduce((d, [x, y], i) => {
    if (i === 0) return `M${x.toFixed(1)} ${y.toFixed(1)}`;
    const [qx, qy] = points[i - 1];
    const mx = (qx + x) / 2;
    return `${d} C${mx.toFixed(1)} ${qy.toFixed(1)} ${mx.toFixed(1)} ${y.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }, "");
}

/** Sparkline paths in a 200×30 box: [line, area]. */
export function sparkline(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pts = values.map((v, i) => [(i * 200) / (values.length - 1), 28 - ((v - min) / Math.max(1e-6, max - min)) * 24] as [number, number]);
  const line = smoothPath(pts);
  return [line, `${line} L200 30 L0 30 Z`] as const;
}
