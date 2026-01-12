# Implementation Plan: Persistent Conversations

Gap analysis between current codebase and the persistent conversations feature requirements.

---

## Summary

| Category | Current | Required | Gap |
|----------|---------|----------|-----|
| API Endpoint | `/api/chat` | `/api/conversations/*` | New endpoints |
| State Management | Local `useState` in ChatInterface | Context/store with conversation state | New context |
| Conversation History | None (ephemeral) | Full persistence with list view | New feature |
| Types | 6 chat types | 15+ conversation types | New types |
| Components | 7 main + 10 UI + 12 file-viewer | +4 new conversation components | New components |
| API Client | Inline fetch calls | `ConversationAPI` class | New module |

---

## New Files to Create

### 1. API Client (`src/lib/conversationApi.ts`)

```
Purpose: Centralized API client for all conversation endpoints
Methods:
  - create(data) → ConversationResponse
  - list(params) → ConversationListResponse
  - get(id) → ConversationDetailResponse
  - update(id, data) → ConversationResponse
  - delete(id) → ConversationResponse
  - addMessage(id, data) → StreamMessageResponse
  - getMessages(id, params) → MessageResponse[]
```

### 2. Conversation Context (`src/components/conversation-provider.tsx`)

```
Purpose: Global state management for conversations
Exports:
  - ConversationProvider component
  - useConversation() hook
State:
  - currentConversationId: string | null
  - conversations: ConversationResponse[]
  - messages: MessageResponse[]
  - isLoading: boolean
  - error: string | null
Actions:
  - setConversation(id)
  - addMessage(message)
  - setMessages(messages)
  - updateExecution(execution)
  - clearConversation()
```

### 3. Conversation List (`src/components/ConversationList.tsx`)

```
Purpose: Sidebar showing past conversations
Features:
  - List of ConversationItem components
  - Filter by project/status
  - "New Conversation" button
  - Loading/empty states
```

### 4. Conversation Item (`src/components/ConversationItem.tsx`)

```
Purpose: Single conversation row in the list
Displays:
  - Title (or "Untitled" fallback)
  - Project badge
  - Relative timestamp
  - Message count
  - Active indicator
Actions:
  - Click to select
  - Context menu (rename, archive, delete)
```

### 5. Conversation Header (`src/components/ConversationHeader.tsx`)

```
Purpose: Header bar for active conversation
Displays:
  - Editable title
  - Project/env/domain badges
  - Status indicator
Actions:
  - Edit title (inline)
  - Archive button
  - New conversation button
```

### 6. Conversation Types (`src/types/conversation.ts`)

```
Purpose: TypeScript definitions for conversation API
Types:
  - CreateConversationRequest
  - UpdateConversationRequest
  - AddMessageRequest
  - CachePolicy
  - ConversationResponse
  - ConversationDetailResponse
  - ConversationListResponse
  - MessageResponse
  - ExecutionResponse
  - StreamMessageResponse
  - ConversationState
  - ConversationAction
```

---

## Existing Files to Modify

### 1. `src/types.ts`

**Changes:**
- Update `Role` type: `"user" | "bot"` → `"user" | "assistant" | "system"`
- Add import/export from new `types/conversation.ts`
- Keep existing types for backward compatibility during migration

### 2. `src/App.tsx`

**Changes:**
- Wrap with `ConversationProvider`
- Add sidebar layout for ConversationList
- Update structure:
  ```
  Before: ThemeProvider → Header → ChatInterface
  After:  ThemeProvider → ConversationProvider → Layout(Sidebar + Main)
  ```

### 3. `src/components/ChatInterface.tsx`

**Changes:**
- Use `useConversation()` hook instead of local state
- Replace `/api/chat` with conversation endpoints
- Add conversation creation on first message (if no active conversation)
- Handle 501 error (feature disabled)
- Load message history when conversation selected
- Update SSE stream URL to `/api/conversations/{id}/stream/{execution_id}`

**Current flow:**
```
sendMessage() → POST /api/chat → { streamUrl } → EventSource
```

**New flow:**
```
sendMessage() →
  if (!conversationId) createConversation()
  POST /api/conversations/{id}/messages → { execution_id, stream_url }
  EventSource(stream_url)
  on done → refreshMessages()
```

### 4. `src/components/ChatInput.tsx`

**Changes:**
- Pass conversation context instead of standalone project/env/domain
- On first message: trigger conversation creation with current selectors
- After conversation created: selectors become read-only (display only)
- Update placeholder text based on message count

### 5. `src/components/ChatBubble.tsx`

**Changes:**
- Support `role: "assistant"` in addition to `"bot"`
- Add `message_type` display (optional)
- Handle `message_metadata` for execution info

---

## New Types Required

```typescript
// Request types
interface CreateConversationRequest {
  project?: string;
  env?: string;
  domain?: string;
}

interface UpdateConversationRequest {
  title?: string;
  domain?: string;
  status?: 'active' | 'archived';
}

interface AddMessageRequest {
  content: string;
  cache?: CachePolicy;
}

interface CachePolicy {
  enabled?: boolean;
  no_cache?: boolean;
  no_store?: boolean;
  ttl_seconds?: number;
}

// Response types
interface ConversationResponse {
  conversation_id: string;
  project_code: string | null;
  env: string | null;
  domain: string | null;
  title: string | null;
  status: 'active' | 'archived';
  is_active: boolean;
  message_count: number;
  has_summary: boolean;
  created_at: string;
  updated_at: string;
}

interface ConversationDetailResponse extends ConversationResponse {
  messages: MessageResponse[];
  summary: string | null;
  executions: ExecutionResponse[];
}

interface ConversationListResponse {
  conversations: ConversationResponse[];
  total: number;
  limit: number;
  offset: number;
}

interface MessageResponse {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  message_type: string | null;
  message_metadata: Record<string, unknown> | null;
  token_count: number | null;
  created_at: string;
}

interface ExecutionResponse {
  execution_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  prompt: string;
  extracted_params: Record<string, unknown> | null;
  trace_ids: string[] | null;
  report_files: string[] | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

interface StreamMessageResponse {
  execution_id: string;
  stream_url: string;
}

// State types
interface ConversationState {
  currentConversationId: string | null;
  conversations: ConversationResponse[];
  messages: MessageResponse[];
  executions: ExecutionResponse[];
  isLoading: boolean;
  error: string | null;
}
```

---

## New SSE Events

The new conversation stream has additional events:

| Event | Current Support | Action Required |
|-------|-----------------|-----------------|
| `Extracted Parameters` | Yes | None |
| `Planned Steps` | **No** | Add handler |
| `Found relevant files` | **No** | Add handler |
| `Found trace id(s)` | Yes | None |
| `Compiled Request Traces` | Yes | None |
| `Compiled Summary` | Yes | None |
| `Verification Results` | Yes | None |
| `error` | **No** | Add handler |
| `done` | Yes | Update to refresh messages |

---

## Implementation Phases

### Phase 1: Foundation (Parallel Mode)

**Goal:** Add conversation support without breaking existing functionality

1. Create `src/types/conversation.ts` with all new types
2. Create `src/lib/conversationApi.ts` API client
3. Create `src/components/conversation-provider.tsx` context
4. Modify `ChatInterface.tsx`:
   - Add conversation creation on first message
   - Store `conversation_id` in session storage
   - Keep existing `/api/chat` as fallback if 501

**Testing:** App works exactly as before, but conversations are created in background

### Phase 2: Conversation UI

**Goal:** Add conversation history and selection

1. Create `ConversationList.tsx` component
2. Create `ConversationItem.tsx` component
3. Create `ConversationHeader.tsx` component
4. Update `App.tsx` with sidebar layout
5. Load message history when selecting conversation
6. Display past messages in ChatInterface

**Testing:** Can see past conversations, switch between them, continue existing ones

### Phase 3: Full Integration

**Goal:** Complete feature with management UI

1. Remove legacy `/api/chat` fallback
2. Add conversation search/filter in sidebar
3. Add rename functionality in header
4. Add archive/delete with confirmation
5. Handle all error states (404, 501, etc.)
6. Add empty state for no conversations
7. Persist last conversation ID to localStorage

**Testing:** Full conversation management workflow

---

## UI Layout Change

**Current:**
```
┌─────────────────────────────────────────┐
│ Header (Logchat + ThemeToggle)          │
├─────────────────────────────────────────┤
│                                         │
│           ChatInterface                 │
│         (Messages + Input)              │
│                                         │
└─────────────────────────────────────────┘
```

**New:**
```
┌─────────────────────────────────────────┐
│ Header (Logchat + ThemeToggle)          │
├────────────┬────────────────────────────┤
│            │ ConversationHeader         │
│ Conversa-  ├────────────────────────────┤
│ tionList   │                            │
│            │      ChatInterface         │
│ - Conv 1   │    (Messages + Input)      │
│ - Conv 2   │                            │
│ - Conv 3   │                            │
│            │                            │
│ [+ New]    │                            │
└────────────┴────────────────────────────┘
```

---

## Error Handling

| Error | Detection | User Message | Recovery |
|-------|-----------|--------------|----------|
| 501 Not Implemented | `response.status === 501` | "Conversation history is not enabled" | Fall back to `/api/chat` or disable sidebar |
| 404 Not Found | `response.status === 404` | "Conversation not found" | Clear selection, refresh list |
| 400 Bad Request | `response.status === 400` | Show validation message | Highlight invalid field |
| 500 Server Error | `response.status === 500` | "Server error. Please retry." | Retry button |
| SSE `error` event | Event listener | "Analysis failed: {message}" | Show in message bubble |

---

## File Checklist

### New Files
- [ ] `src/types/conversation.ts`
- [ ] `src/lib/conversationApi.ts`
- [ ] `src/components/conversation-provider.tsx`
- [ ] `src/components/ConversationList.tsx`
- [ ] `src/components/ConversationItem.tsx`
- [ ] `src/components/ConversationHeader.tsx`

### Modified Files
- [ ] `src/types.ts` - Update Role, add exports
- [ ] `src/App.tsx` - Add provider, sidebar layout
- [ ] `src/components/ChatInterface.tsx` - Use conversation API
- [ ] `src/components/ChatInput.tsx` - Context-aware input
- [ ] `src/components/ChatBubble.tsx` - Support "assistant" role

### Optional Enhancements
- [ ] `src/components/ui/input.tsx` - For inline title editing
- [ ] `src/components/ui/tooltip.tsx` - For action buttons
- [ ] `src/components/ui/alert-dialog.tsx` - For delete confirmation

---

## Dependencies

No new npm packages required. Existing stack supports all features:
- React Context for state management
- Radix Dialog for confirmations (already have)
- Radix ScrollArea for conversation list (already have)
- lucide-react for icons (already have)
