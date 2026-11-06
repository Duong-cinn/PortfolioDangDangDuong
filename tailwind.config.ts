import type { Config } from "tailwindcss";

/** Colors are stored as RGB channels in CSS variables so `/alpha` modifiers work. */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        surface: token("surface"),
        elevated: token("elevated"),
        line: token("line"),
        ink: {
          DEFAULT: token("ink-1"),
          2: token("ink-2"),
          3: token("ink-3"),
        },
        cyan: token("cyan"),
        violet: token("violet"),
        danger: token("danger"),
        success: token("success"),
      },
      fontFamily: {
        sans: ["'Inter Variable'", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["'Space Grotesk Variable'", "'Inter Variable'", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
      },
      fontSize: {
        display: ["var(--fs-display)", { lineHeight: "1.02", letterSpacing: "-0.035em" }],
        h2: ["var(--fs-h2)", { lineHeight: "1.12", letterSpacing: "-0.025em" }],
        h3: ["var(--fs-h3)", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
        body: ["var(--fs-body)", { lineHeight: "1.65" }],
        label: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.14em" }],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
      },
      maxWidth: {
        container: "1200px",
        prose: "68ch",
      },
      boxShadow: {
        elev: "var(--elev-1)",
        glow: "var(--glow-cyan)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out-soft": "cubic-bezier(0.65, 0, 0.35, 1)",
      },
      transitionDuration: {
        fast: "160ms",
        base: "300ms",
        slow: "600ms",
      },
    },
  },
  plugins: [],
} satisfies Config;
