# Codebase Map

Complete mapping of the ai-chat-frontend codebase.

## Project Structure

```
src/
├── main.tsx                      # React entry point
├── App.tsx                       # Root component with sidebar layout
├── index.css                     # Global styles + Tailwind imports
├── types.ts                      # TypeScript type definitions
├── types/
│   └── conversation.ts           # Conversation API types
├── components/
│   ├── ChatInterface.tsx         # Main chat container, SSE handling
│   ├── ChatBubble.tsx            # Message bubble component
│   ├── ChatInput.tsx             # Message input with selectors
│   ├── ToolButton.tsx            # Dropdown selector for params
│   ├── DownloadLink.tsx          # Download link component
│   ├── ThemeToggle.tsx           # Dark/light/system theme toggle
│   ├── theme-provider.tsx        # Theme context provider
│   ├── conversation-provider.tsx # Conversation state management
│   ├── ConversationList.tsx      # Sidebar conversation list
│   ├── ConversationItem.tsx      # Single conversation row
│   ├── ConversationHeader.tsx    # Active conversation header
│   ├── ui/                       # shadcn/ui components
│   └── file-viewer/              # File viewer modal components
├── lib/
│   ├── utils.ts                  # cn() utility (clsx + tailwind-merge)
│   ├── conversationApi.ts        # Conversation API client
│   └── parseSummaryContent.ts    # Parser for summary files
└── assets/

docs/
├── summary-canvas-plan.md        # Summary Canvas feature plan
├── shadcn-tailwind-plan.md       # Shadcn/Tailwind integration plan
├── frontend-integration-guide.md # Persistent conversations API guide
├── IMPLEMENTATION_PLAN.md        # Implementation phases
├── STYLING_ISSUES.md             # Known styling issues
└── CODEBASE.md                   # This file
```

## Stack

- React 19.1.0
- TypeScript 5.6.3
- Vite 7.0.4
- Tailwind CSS 3.4.14
- Radix UI primitives
- lucide-react 0.525.0

## Entry Flow

```
main.tsx
  └── App.tsx
        ├── ThemeProvider
        └── ConversationProvider
              ├── Header (Logchat + ThemeToggle + mobile menu)
              └── Main Layout
                    ├── Sidebar (ConversationList)
                    └── Content
                          ├── ConversationHeader
                          └── ChatInterface
                                ├── Messages (ChatBubble[])
                                ├── ChatInput (ToolButton dropdowns)
                                └── FileViewerModal
```

---

## Conversation Components

### conversation-provider (`src/components/conversation-provider.tsx`)

Global state management for conversations:
- `ConversationProvider` component
- `useConversation()` hook
- localStorage persistence (key: `logchat-conversation-id`)
- State: currentConversationId, conversations, messages, executions, isLoading, error, featureEnabled, isLoadingList, listError
- Actions:
  - `createConversation` - Create new conversation
  - `loadConversation` - Load conversation with messages
  - `refreshMessages` - Refresh messages for current conversation
  - `refreshConversationList` - Refresh the conversations list from server
  - `updateConversationInList` - Update a conversation's metadata in the list
  - `removeConversationFromList` - Remove a conversation from the list (after archive)
  - `clearConversation` - Clear current conversation selection
  - `addOptimisticMessage` - Add temporary user message before server response
  - `addExecution` - Track new execution
  - `updateExecution` - Update execution status (running → completed/failed)

### ConversationList (`src/components/ConversationList.tsx`)

Sidebar showing past conversations:
- Uses centralized state from ConversationProvider (auto-syncs on create/archive)
- List of ConversationItem components
- Search input (filters by title, project, domain)
- Project filter dropdown
- Refresh and "New conversation" buttons
- Loading skeletons, error state, empty state
- Archive confirmation dialog

### ConversationItem (`src/components/ConversationItem.tsx`)

Single conversation row in the sidebar:
- Title (or "Untitled" fallback)
- Project badge
- Relative timestamp
- Message count
- Active indicator (left border)
- Context menu (Archive action)

### ConversationHeader (`src/components/ConversationHeader.tsx`)

Header bar for active conversation:
- Editable title (inline edit)
- Project/env/domain badges
- Archive button with confirmation dialog

### conversationApi (`src/lib/conversationApi.ts`)

API client for conversation endpoints:
- `create(data)` - Create new conversation
- `list(params)` - List conversations with filters
- `get(id)` - Get conversation details with messages
- `update(id, data)` - Update title/status
- `delete(id)` - Archive conversation
- `addMessage(id, data)` - Send message and get stream URL
- `getMessages(id, params)` - Get message history
- `checkFeatureEnabled()` - Check if backend supports conversations

---

## Main Components

### ChatInterface (`src/components/ChatInterface.tsx`)

Main chat container managing:
- Message state array (synced with conversation context)
- SSE streaming via EventSource
- Execution tracking (status: pending → running → completed/failed)
- Download link generation
- FileViewerModal integration
- Dual API support: `/api/conversations` (preferred) or `/api/chat` (fallback)
- Message history loading when conversation selected

### ChatBubble (`src/components/ChatBubble.tsx`)

Renders individual messages:
- User/bot role badges
- Streaming skeleton indicator
- Grouped download links by category:
  - `relevant`, `less_relevant`, `not_relevant`
  - `trace_analysis`, `master_summary`, `verification`
- Category-specific icons and styling

### ChatInput (`src/components/ChatInput.tsx`)

Message input area:
- Auto-growing textarea
- Project selector (NCC, ABBL, GIGLY)
- Environment selector (DEV, UAT, PROD)
- Domain selector (General, Transaction, Notification, OTP, Registration, User Info)
- Send button (Ctrl+Enter / Cmd+Enter)

### ToolButton (`src/components/ToolButton.tsx`)

Reusable dropdown selector:
- Icon support (Lucide icons)
- Selected value display
- Check mark on active option
- Customizable options array

### ThemeToggle (`src/components/ThemeToggle.tsx`)

Theme switcher:
- Light/Dark/System options
- Dynamic icon rotation
- Uses `useTheme()` hook

### theme-provider (`src/components/theme-provider.tsx`)

Theme context provider:
- `ThemeProvider` component
- `useTheme()` hook
- localStorage persistence (key: `chat-theme`)
- System preference detection via `matchMedia`

### DownloadLink (`src/components/DownloadLink.tsx`)

Simple download link component (mostly superseded by ChatBubble grouping).

---

## UI Components (`src/components/ui/`)

shadcn/ui style components built on Radix primitives with `class-variance-authority`:

| Component | Description |
|-----------|-------------|
| `alert-dialog.tsx` | Confirmation dialog with cancel/confirm actions (Radix) |
| `badge.tsx` | Variants: default, secondary, info, muted, success, warning, destructive |
| `button.tsx` | Variants: default, destructive, outline, secondary, ghost, link |
| `card.tsx` | CardRoot, CardHeader, CardFooter, CardTitle, CardDescription, CardContent |
| `collapsible.tsx` | Animated collapsible wrapper (Radix) |
| `dialog.tsx` | Modal dialog with overlay and close button (Radix) |
| `dropdown-menu.tsx` | Menu trigger, content, items, checkbox items, labels, separators (Radix) |
| `input.tsx` | Styled text input with focus ring |
| `scroll-area.tsx` | Scrollable container (Radix) |
| `select.tsx` | Select trigger, content, items (Radix) |
| `skeleton.tsx` | Loading placeholder |
| `textarea.tsx` | Styled textarea with ref forwarding |

---

## File Viewer Components (`src/components/file-viewer/`)

Modal system for viewing and parsing summary files:

| Component | Purpose |
|-----------|---------|
| `FileViewerModal.tsx` | Main dialog container, switches between raw/structured views |
| `FileViewerHeader.tsx` | Displays filename, file type badge, download button |
| `FileViewerLoading.tsx` | Loading skeleton state |
| `FileViewerError.tsx` | Error message with fallback download |
| `RawContentView.tsx` | Monospace `<pre>` display of raw content |
| `StructuredSummaryView.tsx` | Layout orchestrator for parsed summary data |
| `SummaryMetadataCard.tsx` | Displays generated date, model, trace/log counts |
| `CustomerDisputeCard.tsx` | Shows dispute date and username |
| `TraceAccordion.tsx` | Collapsible container for all traces |
| `TraceAccordionItem.tsx` | Individual trace with relevance, status, findings, recommendations |
| `TimelineSection.tsx` | Chronological log entries with level color coding |
| `index.ts` | Barrel exports |

---

## Types

### Chat Types (`src/types.ts`)

```typescript
type Role = "user" | "bot" | "assistant" | "system"

type DownloadType =
  | "relevant"
  | "less_relevant"
  | "not_relevant"
  | "trace_analysis"
  | "master_summary"
  | "verification"

interface DownloadLink { name, url, type }
interface Message { from, text, isStreaming?, downloadLinks? }
interface StreamEventPayload { event, data }
interface ChatRequestBody { prompt, project, env, domain }
```

### Conversation Types (`src/types/conversation.ts`)

```typescript
// Request types
interface CreateConversationRequest { project?, env?, domain? }
interface UpdateConversationRequest { title?, domain?, status? }
interface AddMessageRequest { content, cache? }
interface CachePolicy { enabled?, no_cache?, no_store?, ttl_seconds? }

// Response types
interface ConversationResponse {
  conversation_id, project_code, env, domain, title, status,
  is_active, message_count, has_summary, created_at, updated_at
}
interface ConversationDetailResponse extends ConversationResponse {
  messages, summary, executions
}
interface ConversationListResponse { conversations, total, limit, offset }
interface MessageResponse { id, role, content, message_type, message_metadata, token_count, created_at }
interface ExecutionResponse { execution_id, status, prompt, extracted_params, trace_ids, report_files, error_message, started_at, completed_at }
interface StreamMessageResponse { execution_id, stream_url }

// State types
interface ConversationState {
  currentConversationId, conversations, messages, executions, isLoading, error, featureEnabled
}
```

### File Viewer Types (`src/types.ts`)

```typescript
interface SummaryMetadata { filename, generatedDate, totalTraces, totalLogEntries, model }
interface CustomerDispute { date, username, rawText? }
interface TraceAnalysis { traceNumber, traceId, relevanceScore, transactionStatus, keyFinding, recommendation }
interface TimelineEntry { index, timestamp, level, service, traceId, message }
interface ParsedSummaryContent { metadata, customerDispute, traces, timeline, rawContent }
interface FileViewerState { isOpen, isLoading, error, filename, fileType, content, parsedContent, downloadUrl }
```

---

## Utilities (`src/lib/`)

### utils.ts

```typescript
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### conversationApi.ts

API client class with methods for all conversation endpoints. Handles 501 (feature disabled) gracefully.

### parseSummaryContent.ts

Parses raw summary file content into structured data:
- `parseSummaryContent(rawContent, filename)` - Main parser
- `parseMetadata()` - Extracts header info
- `parseCustomerDispute()` - Finds dispute section
- `parseTraces()` - Iterates through trace analysis
- `parseTimeline()` - Parses log entries

---

## API Flow

### Legacy API (fallback)

```
POST /api/chat → { streamUrl } → EventSource(streamUrl)
```

### Conversation API (preferred)

```
POST /api/conversations → { conversation_id }
POST /api/conversations/{id}/messages → { execution_id, stream_url }
EventSource(stream_url)
GET /api/conversations/{id}/messages (after stream ends)
```

### Built-in SSE Handlers

| Event | Behavior |
|-------|----------|
| `Extracted Parameters` | Parses and displays time_frame, domain, query_keys |
| `Planned Steps` | Displays numbered analysis plan steps |
| `Downloaded logs in file` | Shows "Downloaded logs" confirmation |
| `Found relevant files` | Displays count of relevant files found |
| `Found trace id(s)` | Displays count of requests found |
| `Compiled Request Traces` | Confirmation message |
| `Compiled Summary` | Processes created_files + master_summary_file into DownloadLink[] |
| `Verification Results` | Parses Relevant/Less Relevant/Not Relevant files via regex |
| `error` | Displays error message, closes stream, marks execution as failed |
| `done` | Finalizes message, closes EventSource, marks execution completed, refreshes messages |
| `defaultHandler` | Unknown events logged as raw JSON |

---

## Styling

### Theme System

- Dark/light mode via `class` strategy on `<html>`
- Theme stored in localStorage key `chat-theme`
- Values: `"light"`, `"dark"`, `"system"`

### CSS Variables (defined in `index.css`)

```css
:root {
  --background, --foreground
  --card, --card-foreground
  --popover, --popover-foreground
  --primary, --primary-foreground
  --secondary, --secondary-foreground
  --muted, --muted-foreground
  --accent, --accent-foreground
  --destructive, --destructive-foreground
  --border, --input, --ring
  --radius
}
```

Colors use HSL format: `hsl(var(--primary))`

---

## Dependencies

### Core
- react 19.1.0
- react-dom 19.1.0
- typescript 5.6.3
- vite 7.0.4

### Styling
- tailwindcss 3.4.14
- tailwindcss-animate
- autoprefixer
- class-variance-authority 0.7.1
- clsx 2.1.1
- tailwind-merge 3.4.0

### UI Primitives (Radix)
- @radix-ui/react-alert-dialog
- @radix-ui/react-collapsible
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- @radix-ui/react-scroll-area
- @radix-ui/react-select
- @radix-ui/react-switch

### Icons
- lucide-react 0.525.0

---

## Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.js` | Vite build config, dev server proxy |
| `tailwind.config.cjs` | Tailwind theme extensions |
| `postcss.config.cjs` | PostCSS plugins |
| `tsconfig.json` | TypeScript compiler options |
| `eslint.config.js` | ESLint rules |
| `.env` | Environment variables (VITE_API_URL) |

---

## Local Storage Keys

| Key | Purpose |
|-----|---------|
| `chat-theme` | Theme preference (light/dark/system) |
| `logchat-conversation-id` | Last active conversation ID |
