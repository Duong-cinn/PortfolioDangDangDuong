import type { ReactNode } from "react";

/**
 * Tiny inline markup for headlines kept in config:
 *   *word*    → serif italic accent
 *   [words]   → accent gradient text
 *   \n        → line break
 */
export function richText(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*([^*]+)\*|\[([^\]]+)\]|\n/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<em key={k++} className="serif">{m[1]}</em>);
    else if (m[2]) out.push(<span key={k++} className="accent">{m[2]}</span>);
    else out.push(<br key={k++} />);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
