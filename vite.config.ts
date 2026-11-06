import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { readFileSync } from "fs";

/** Warns on `vite build` while src/data/config.ts still contains SAMPLE / TODO(content) markers. */
function contentGuard(): Plugin {
  return {
    name: "content-guard",
    apply: (_config, env) => env.command === "build" && !env.isSsrBuild,
    buildStart() {
      const file = path.resolve(__dirname, "src/data/config.ts");
      const lines = readFileSync(file, "utf8").split(/\r?\n/);
      const hits = lines
        .map((line, i) => ({ line: i + 1, sample: /\/\/.*\bSAMPLE\b/.test(line), todo: /\/\/.*TODO\(content\)/.test(line) }))
        .filter((h) => h.sample || h.todo);
      const samples = hits.filter((h) => h.sample).length;
      const todos = hits.filter((h) => h.todo).length;
      if (samples || todos) {
        this.warn(
          `config.ts still has ${samples} SAMPLE and ${todos} TODO(content) marker(s) — placeholder content will be published. ` +
            `Lines: ${hits.map((h) => h.line).join(", ")}`,
        );
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), contentGuard()],
  build: {
    // The lazy three.js chunk (orbitScene) is ~500 kB raw / ~130 kB gzip by design; everything else stays small.
    chunkSizeWarningLimit: 560,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
});
