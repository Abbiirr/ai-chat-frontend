import ChatInterface from "./components/ChatInterface";
import { ThemeToggle } from "./components/ThemeToggle";
import { ThemeProvider } from "./components/theme-provider";

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="chat-theme">
      <div className="min-h-screen bg-background text-foreground">
        <div className="container flex min-h-screen flex-col gap-8 py-10">
          <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Observability copilot
              </p>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                  Loggy
                </h1>
                <p className="text-sm text-muted-foreground">
                  Streamlined chat for hunting traces and summaries.
                </p>
              </div>
            </div>

            <ThemeToggle />
          </header>

          <ChatInterface />
        </div>
      </div>
    </ThemeProvider>
  );
}
