import { useEffect, useRef } from "react";

const CHAR_MS = 22;
const NEWLINE_MS = 120;
const LOOP_WAIT_MS = 3200;

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Minimal TS highlighter: keywords, keys, strings, booleans/numbers, punctuation. Works on partial text. */
function highlight(src: string) {
  const re = /("(?:[^"\\]|\\.)*"?)|\b(export|const|true|false)\b|(\b\d+(?:\.\d+)?\b)|(\b[a-zA-Z_]\w*)(?=:)|([{}[\],;=])/g;
  let out = "";
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    out += escape(src.slice(last, m.index));
    const cls = m[1] ? "tk-str" : m[2] ? (m[2] === "true" || m[2] === "false" ? "tk-num" : "tk-kw") : m[3] ? "tk-num" : m[4] ? "tk-key" : "tk-punct";
    out += `<span class="${cls}">${escape(m[0])}</span>`;
    last = re.lastIndex;
  }
  return out + escape(src.slice(last));
}

/**
 * Types `code` one character at a time once 30% of it is visible, waits, and starts over.
 * Prerendered / no-JS / reduced motion: the full text, highlighted, no caret animation.
 */
export default function TypingCode({ code, className }: { code: string; className?: string }) {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer = 0;
    let i = 0;
    let running = false;
    const caret = '<span class="caret" aria-hidden="true"></span>';
    const render = () => (el.innerHTML = highlight(code.slice(0, i)) + caret);

    const step = () => {
      if (i >= code.length) {
        timer = window.setTimeout(() => {
          i = 0;
          step();
        }, LOOP_WAIT_MS);
        return;
      }
      i++;
      render();
      timer = window.setTimeout(step, code[i - 1] === "\n" ? NEWLINE_MS : CHAR_MS);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          render();
          step();
        } else if (!entry.isIntersecting && running) {
          // pause off-screen, resume where it was
          running = false;
          window.clearTimeout(timer);
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [code]);

  return <pre ref={ref} className={className} dangerouslySetInnerHTML={{ __html: highlight(code) }} />;
}
