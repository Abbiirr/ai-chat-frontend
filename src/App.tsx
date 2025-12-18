import ChatInterface from "./components/ChatInterface";
import { ThemeToggle } from "./components/ThemeToggle";
import { ThemeProvider } from "./components/theme-provider";

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="chat-theme">
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3">
            <div className="leading-tight">
              <p className="text-xs font-medium text-muted-foreground">
                Observability copilot
              </p>
              <h1 className="text-base font-semibold tracking-tight">Logchat</h1>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-4xl flex-1 min-h-0 flex-col px-4">
          <ChatInterface />
        </main>
      </div>
    </ThemeProvider>
  );
}
