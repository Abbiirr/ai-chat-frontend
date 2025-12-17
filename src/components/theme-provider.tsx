import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

const isTheme = (value: string | null): value is Theme =>
  value === "light" || value === "dark" || value === "system";

const resolveSystemTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const applyThemeToDocument = (theme: "light" | "dark") => {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.setAttribute("data-theme", theme);
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "chat-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  const resolvedTheme = useMemo(
    () => (theme === "system" ? resolveSystemTheme() : theme),
    [theme],
  );

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    const initialTheme = isTheme(stored) ? stored : defaultTheme;
    setTheme(initialTheme);
    applyThemeToDocument(
      initialTheme === "system" ? resolveSystemTheme() : initialTheme,
    );
  }, [defaultTheme, storageKey]);

  useEffect(() => {
    if (theme !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyThemeToDocument(resolveSystemTheme());
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, [theme]);

  useEffect(() => {
    applyThemeToDocument(resolvedTheme);
  }, [resolvedTheme]);

  const handleSetTheme = (next: Theme) => {
    setTheme(next);
    localStorage.setItem(storageKey, next);
    applyThemeToDocument(next === "system" ? resolveSystemTheme() : next);
  };

  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme: handleSetTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
