import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const storageKey = "chat-theme";

const applyInitialTheme = () => {
  const root = document.documentElement;
  try {
    const stored = localStorage.getItem(storageKey);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isLight = stored === "light";
    const isDark = stored === "dark";
    const isSystem = stored === "system" || stored === null;
    const theme = isLight ? "light" : isDark ? "dark" : isSystem && prefersDark ? "dark" : "light";

    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.setAttribute("data-theme", theme);
  } catch {
    root.classList.add("light");
    root.setAttribute("data-theme", "light");
  }
};

applyInitialTheme();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
