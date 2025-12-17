import { useEffect, useState } from "react";
import ChatInterface from "./components/ChatInterface";
import "./App.css";

type Theme = "dark" | "light" | "high-contrast";

const isTheme = (value: string | null): value is Theme =>
  value === "dark" || value === "light" || value === "high-contrast";

export default function App() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("chat-theme");
    const savedTheme = isTheme(stored) ? stored : "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("chat-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <div className="App app-fade-in" data-theme={theme}>
      {/* You can add a theme toggle button here if needed */}
      {/*
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? 'ƒ~?‹,?' : 'dYOT'}
      </button>
      */}

      <ChatInterface />
    </div>
  );
}
