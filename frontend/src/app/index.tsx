import { createRoot } from "react-dom/client";
import "@shared/config";
import "./index.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(<App />);
