import { createRoot, hydrateRoot } from "react-dom/client";
import "./styles/fonts.css";
import "./index.css";
import App from "./App.tsx";

const root = document.getElementById("root")!;

// Production HTML is prerendered (scripts/prerender.mjs) → hydrate; dev server → plain render.
if (root.firstElementChild) hydrateRoot(root, <App />);
else createRoot(root).render(<App />);

// Tells the inline guard in index.html that JS is alive (otherwise it un-hides .reveal content).
document.documentElement.dataset.hydrated = "1";
