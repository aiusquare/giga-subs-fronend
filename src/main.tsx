import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { brandConfig } from "./config/brands";
import { applyBrandTheme } from "./lib/theme";

// Apply brand CSS variables synchronously before first paint
applyBrandTheme(brandConfig);

createRoot(document.getElementById("root")!).render(<App />);
