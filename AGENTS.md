# AGENTS: ai-chat-frontend codebase guide

## Run it
- Dev server: `npm install` then `npm run dev` (Vite, React 19).
- Build: `npm run build`; preview: `npm run preview`; lint: `npm run lint`.
- Uses `.env` for runtime config; `VITE_API_URL` defaults to `http://10.112.30.10:8000` when unset.

## Top-level map
- TypeScript is configured via `tsconfig.json` (strict, noEmit) with a small shared types file at `src/types.ts`; Vite env types live in `src/vite-env.d.ts`.
- `src/main.tsx` bootstraps React and mounts `<App />`.
- `src/App.tsx` loads the saved theme (`localStorage` key `chat-theme`), applies the `data-theme` attribute, and renders `<ChatInterface />` (theme toggle is commented out).
- Styling: global variables in `src/variables.css`, global resets/backgrounds in `src/index.css`, app container rules in `src/App.css`.
- Components live in `src/components/`: `ChatInterface`, `ChatInput`, `ChatBubble`, `ToolButton`, `DownloadLink` (utility component), plus their CSS.

## Message flow (ChatInterface.tsx)
- State: `messages` (array of `{from, text, isStreaming?, downloadLinks?}`), `input`, `isStreaming`, plus refs for scrolling, SSE instance (`eventSourceRef`), deduplication (`processedEventsRef`), and an unused `lastChunkRef`.
- Sending: `sendMessage(userMessage, project, env, domain)` posts JSON `{prompt, project, env, domain}` to `POST <VITE_API_URL>/api/chat`. The response must contain `{streamUrl}`; an `EventSource` is opened with `new URL(streamUrl, VITE_API_URL)`. While streaming, a bot bubble with `isStreaming: true` is appended.
- SSE parsing: messages are simple `event:<name>\ndata:<payload>` records (`parseEventMessage`). Handlers receive both raw and JSON-parsed payloads.
- Built-in SSE handlers:
  - `Extracted Parameters`: echoes found parameters (time_frame, domain, query_keys).
  - `Downloaded logs in file`: appends “Downloaded logs”.
  - `Found trace id(s)`: appends count text.
  - `Compiled Request Traces`: appends status text.
  - `Compiled Summary`: converts `created_files` and `master_summary_file` into download links.
  - `Verification Results`: parses summary text plus `Relevant files`, `Less Relevant Files`, `Not Relevant Files` lists into grouped download links.
  - `done`: appends the final chunk, flips `isStreaming` off, and closes SSE.
  - Any other event uses `defaultHandler`, which dumps the event name and payload JSON.
- Deduplication: processed events are tracked by a `${event}-${data}` key; repeats are ignored.
- Download link construction: `buildDownloadLinks` maps filenames to `<VITE_API_URL>/download/?filename=<name>` and tags them with a `type` used for grouping in the UI.
- Cleanup: SSE is closed on component unmount and when errors occur.

## UI components
- `ChatInterface`: header (“Loggy”), welcome placeholder, message list, and the input footer. Scrolls to the newest message via `scrollRef`.
- `ChatBubble`: renders user/bot bubbles, optional typing dots for `isStreaming`, and grouped download pills per link `type` (`relevant`, `less_relevant`, `not_relevant`, `trace_analysis`, `master_summary`, `verification`). Non-ASCII glyphs in titles/icons come from the source assets.
- `ChatInput`: textarea that auto-grows, sends via `<Send />` icon button, and exposes three selectors (project, env, domain) backed by `ToolButton`. Shows current selections as “param pills”. Send is disabled while streaming or when the input is empty.
- `ToolButton`: icon button (default `Settings2`, can be overridden) that opens a dropdown of options and calls `onSelect(option)`.
- `DownloadLink`: simple anchor-with-icon helper; CSS and component exist but are not wired into the current UI (download rendering happens inside `ChatBubble` instead).

## Styling and theming
- CSS variables define colors, typography, spacing, radii, z-index, glassmorphism, and accents for dark (default), `data-theme="light"`, and `data-theme="high-contrast"`.
- Global styles include gradient backgrounds, focus rings, scrollbar styling, code block styling, and motion-reduction fallbacks. Tailwind directives are present but components use authored CSS.
- Component CSS files (`ChatInterface.css`, `ChatBubble.css`, `ChatInput.css`, `ToolButton.css`) implement the glass/gradient look, message tails, download grids, sticky footer, dropdown menu, and responsive tweaks.

## Notable behaviors and gaps
- API host comes from `VITE_API_URL`; no retry/backoff or auth handling is implemented.
- SSE `done` is handled both via a named event listener and the `done` entry in `handlers` for redundancy.
- Some stray non-ASCII characters remain in labels/icons; keep them if preserving current visuals.
- `DownloadPanel.css` exists without a JSX counterpart; `DownloadLink` is unused in current rendering.
- No tests are present; state is entirely local (no global store).

## Quick steps for common changes
- Add a new SSE event: define a handler in `handlers` keyed by the event name, update message/download state as needed, and ensure the server emits `event:<name>` lines.
- Change the API host: update the two occurrences in `sendMessage` (`fetch` and `EventSource`) and in `buildDownloadLinks`/`Verification Results` link generation.
- Theme toggle: uncomment the stubbed button in `App.tsx` or wire a control to `toggleTheme`.
