# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start Vite dev server (localhost:3000)
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## Environment

Set `VITE_API_URL` in `.env` to configure the backend API endpoint. Defaults to `http://10.112.30.10:8000` when unset. The dev server proxies `/api` requests to this target.

## Architecture

**Stack**: React 19 + TypeScript + Vite + Tailwind CSS + Radix UI primitives

**Entry flow**: `main.tsx` → `App.tsx` (ThemeProvider wrapper) → `ChatInterface.tsx`

**Key components** in `src/components/`:
- `ChatInterface` - Main chat container, handles SSE streaming, message state, and download link generation
- `ChatInput` - Auto-growing textarea with project/env/domain selectors via `ToolButton`
- `ChatBubble` - Renders user/bot messages with optional streaming indicator and grouped download links
- `ToolButton` - Icon button dropdown for parameter selection
- `ThemeToggle` / `theme-provider` - Dark/light/system theme management (stored in `localStorage` key `chat-theme`)

**UI components** in `src/components/ui/`: shadcn/ui style components (button, badge, card, select, dropdown-menu, etc.) built on Radix primitives with `class-variance-authority`.

**Types** defined in `src/types.ts`: `Message`, `DownloadLink`, `DownloadType`, `ChatRequestBody`, `StreamEventPayload`

**Styling**: Tailwind with CSS variables for theming. Colors defined via HSL variables (`--background`, `--foreground`, `--primary`, etc.). Dark mode via `class` strategy.

## SSE Message Flow

`ChatInterface.sendMessage()` POSTs to `/api/chat` with `{prompt, project, env, domain}`, receives `{streamUrl}`, then opens an EventSource. Events are parsed from `event:<name>\ndata:<payload>` format.

Built-in SSE handlers: `Extracted Parameters`, `Downloaded logs in file`, `Found trace id(s)`, `Compiled Request Traces`, `Compiled Summary`, `Verification Results`, `done`. Unknown events use `defaultHandler`.

To add a new SSE event: add a handler in the `handlers` object in `ChatInterface.tsx`.
