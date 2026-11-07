import { createRoot } from "react-dom/client";
import "../styles/fonts.css";
import "../index.css";
import "./og.css";
import OgCard, { AppIcon } from "./OgCard";

const icon = new URLSearchParams(location.search).has("icon");
createRoot(document.getElementById("root")!).render(icon ? <AppIcon /> : <OgCard />);
