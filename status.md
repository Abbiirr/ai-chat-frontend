# Project Status & Developer Onboarding

> Repository: `ai-chat-frontend`  
> Stack: React 19 + Vite + Zustand + Plain CSS (with some Tailwind infra available) + SSE integration

## 1. High-Level Purpose

A lightweight AI/chat-focused frontend that:

- Maintains conversations (user + bot messages)
- Streams assistant (bot) responses via Server-Sent Events (SSE)
- Displays contextual trace/log data in a right sidebar
- Provides collapsible left (Chats) and right (Context) panels

## 2. Run / Build

Scripts (from `package.json`):

- `npm run dev` — Start Vite dev server
- `npm run build` — Production build
- `npm run preview` — Preview production build
- `npm run lint` — Run ESLint (configured via flat config `eslint.config.js`)

Assumptions:

- Backend API base: `http://localhost:8000` (see `src/services/api.js`)
- SSE endpoints provided by backend respond with newline-delimited event/data fields

## 3. Core Architecture

```
src/
  App.jsx                # Root composition: LeftSidebar, MainPanel, RightSidebar
  hooks/
    useChat.js           # Chat state (messages, streaming) + SSE lifecycle
  components/
    Sidebar/
      LeftSidebar.jsx    # Chats list + collapse toggle
      RightSidebar.jsx   # Context / trace info + collapse toggle
      Sidebar.css        # Sidebar styles & transitions
    ... (other planned folders: Layout, Chat, etc.)
  services/
    api.js               # REST + SSE connection helpers
    sseHandler.js        # Thin wrapper over EventSource w/ handler registry
  store/
    chatStore.js         # Zustand global store: conversations, UI flags, traces
  styles/                # (Global / additional style assets)
```

### Data Flow Overview

1. User enters prompt → `MainPanel` calls `sendMessage` (from `useChat`).
2. `useChat.sendMessage`:
   - Pushes user message + a placeholder streaming bot message
   - Calls `api.sendMessage()` (POST /api/chat)
   - Receives `{ streamUrl }` from backend
   - Creates SSE connection (`api.createSSEConnection`) and delegates to `SSEHandler`
3. `SSEHandler` listens to raw `message` events → parses lines for `event:` and `data:` → attempts JSON parse → dispatches to either a registered handler or a generic callback provided by `useChat`.
4. Each SSE chunk updates the last bot message text.
5. When SSE ends or errors → streaming flags cleared.

### UI State Responsibilities

- Local (hook-level): `useChat` manages `messages`, `isStreaming`, `downloadLinks`, `currentTrace`.
- Global (Zustand via `chatStore.js`):
  - Conversation list + active conversation
  - Sidebar open/closed booleans (`isSidebarOpen`, `isContextPanelOpen`)
  - Selected trace and related details (placeholder logic now)

Current duplication: Messages are stored both in the hook (`useChat`) and in the zustand store only partially for conversations. A future unification step is recommended.

## 4. Key Files Explained

### `src/hooks/useChat.js`

Responsibilities:

- Exposes: `{ messages, isStreaming, currentTrace, downloadLinks, sendMessage, clearChat }`
- Sends a message and wires SSE streaming.
- Maintains a final bot message by appending streamed chunks.
- Named + default export provided for compatibility.

### `src/services/api.js`

- Provides HTTP helpers and returns JSON. Assumes backend endpoints:
  - `POST /api/chat` → returns `{ streamUrl }`
  - `GET /api/trace/:traceId`
  - `GET /api/logs?query=...`
- `createSSEConnection(streamUrl)` currently returns a raw `EventSource` (constructed with concatenated base + path). `useChat` wraps with `SSEHandler`.

### `src/services/sseHandler.js`

- Wraps native `EventSource`.
- Supports registering event-specific handlers.
- De-duplicates events using a `processedEvents` Set keyed by `eventType + rawData`.
- Standard events enumerated in `SSE_EVENTS` (currently not fully consumed by UI).

### `src/store/chatStore.js`

State slices:

- Conversations: array of `{ id, title, timestamp, messages? }`
- Active conversation ID + current messages (re-synced on setActiveConversation)
- UI flags: sidebar/context/log viewer open
- Trace state + download links
  Actions include addConversation, setActiveConversation, addMessage, updateLastMessage, toggles.

### `src/components/Sidebar/LeftSidebar.jsx`

- Visual list of conversations with toggle button.
- Accepts `isOpen`, `toggleSidebar`, `conversations`, `activeConv`, `setActiveConv`.
- Only renders list/content when open (optimizes unnecessary DOM work).

### `src/components/Sidebar/RightSidebar.jsx`

- Displays placeholder contextual info (selected trace, logs count, quick tools, shortcuts) with toggle.

### `src/components/Sidebar/Sidebar.css`

- Handles open/closed widths, transitions, toggle button visual style (fixed-position tab), fading content in/out.
- Contains styles for chat list, context sections, quick tools, scrollbars, icons.

## 5. Current State / Gaps

| Area                      | Status                 | Notes                                                            |
| ------------------------- | ---------------------- | ---------------------------------------------------------------- |
| Chat streaming            | Functional (basic)     | SSE parsing naive (line-based). No heartbeats or retry/backoff.  |
| Conversation persistence  | In-memory only         | Reload clears everything.                                        |
| Message-store unification | Not done               | Duplicate concerns between hook + store.                         |
| Error handling            | Minimal                | Only console errors; no user-facing alerts.                      |
| Trace integration         | Placeholder            | API call exists but not wired into UI.                           |
| Download links            | Placeholder state only | Need attaching logic in SSE events.                              |
| Theming                   | Custom CSS             | Tailwind present but unused; decision needed.                    |
| Testing                   | None                   | Add basic unit tests for hook + SSE handler.                     |
| Accessibility             | Basic                  | Added `aria-expanded` on toggles; more landmarks/roles possible. |

## 6. Recommended Next Steps

Priority order (suggested):

1. Unify message state: move `messages` fully into `chatStore` OR keep in `useChat` and derive conversation snapshots.
2. Introduce event-type aware SSE handling (map specific SSE events to UI updates: traces, downloads, summaries).
3. Add persistence (localStorage or server sync) for conversations + sidebar open state.
4. Implement error UI (toast/banner) for network/SSE failures.
5. Write tests:
   - `useChat` (mock api + manual event dispatch)
   - `SSEHandler.parseEventMessage` edge cases
6. Replace inline `<style>` block in `App.jsx` with dedicated CSS or Tailwind classes for consistency.
7. Normalize timestamps (store ISO only; format in render layer).
8. Type safety: migrate to TypeScript or add JSDoc typedefs.
9. Provide a proper layout component (header, resizable center panel, side panels).
10. Add keyboard shortcuts (toggle sidebars, focus input, cycle conversations).

## 7. SSE Event Handling Roadmap

Planned (example mapping):

- `Extracted Parameters` → highlight extracted fields in context panel
- `Found trace id(s)` → update `selectedTrace`
- `Downloaded logs in file` → push download link into `downloadLinks`
- `Compiled Summary` → finalize streaming bot message
- `done` → clear streaming flag

Implement by registering handlers in `SSEHandler` before `connect`, e.g.:

```js
sseRef.current.registerHandler(SSE_EVENTS.COMPILED_SUMMARY, (data) => {
  setMessages((prev) => /* finalize summary */ prev);
});
```

## 8. Data Shapes (Current)

```ts
Conversation = {
  id: string,
  title: string,
  timestamp: string, // ISO
  messages?: Message[]
}

Message = {
  id: string|number,
  from: 'user' | 'bot',
  text: string,
  isStreaming?: boolean,
  timestamp?: string
}
```

## 9. Edge Cases / Risks

- SSE can silently close: need reconnect or user notification.
- Large streamed JSON chunks may cause UI jank (consider batching append).
- Duplicate events: current dedupe logic uses raw concatenation; distinct events with same payload suppressed.
- Race condition: user sends multiple messages quickly while `isStreaming` true (currently blocked). Consider queue or parallel conversation threads.

## 10. Developer Onboarding Steps

1. Clone + install:
   ```bash
   npm install
   npm run dev
   ```
2. Ensure backend at `http://localhost:8000` (adjust `API_BASE` in `api.js` if different).
3. Open browser: typically `http://localhost:5173` (Vite default, confirm in terminal output).
4. Test chat:
   - Enter a prompt → verify a streaming bot message appears.
   - Inspect Network tab for `/api/chat` and subsequent SSE connection.
5. Toggle sidebars to confirm collapse animations.
6. (Optional) Simulate SSE events if backend incomplete: mock `api.sendMessage` to return a test `streamUrl` served by a local SSE script.
7. Start implementing event-specific UI updates (see Section 7).

## 11. Quick Contribution Guide

- Prefer small, focused PRs.
- Run `npm run lint` before committing.
- Add/update JSDoc or comments for any non-trivial logic.
- Keep UI states declarative; avoid imperative DOM manipulation.
- For new SSE events, extend `SSE_EVENTS` enum and add a corresponding handler mapping near `useChat.sendMessage`.

## 12. Open Questions

- Should we migrate styles fully to Tailwind (already configured) or keep handcrafted CSS?
- Do we plan multi-project/multi-env support in the UI (params exist in `sendMessage`)?
- How are traces selected/updated—via separate search panel or messages referencing them?
- Should conversation history persist between sessions (localStorage vs. backend)?

## 13. Glossary

- SSE: Server-Sent Events — one-way streaming from server to client using EventSource.
- Streaming message: Temporary bot message with `isStreaming: true` whose `text` grows with SSE chunks.
- Trace: Identifier for a collected request/operation log bundle (placeholder right now).

## 14. Immediate Low-Hanging Improvements

- Add a loading spinner or animated ellipsis component instead of raw `...` text.
- Factor out inline styles in `App.jsx` into a stylesheet.
- Add `aria-live="polite"` region for streaming bot message for screen readers.
- Add a retry button when SSE fails.

---

This document should give a new engineer enough context to begin extending the chat and SSE features. Update this file as architecture evolves.
