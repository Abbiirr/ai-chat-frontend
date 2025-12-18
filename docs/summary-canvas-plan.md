# Summary Analysis Canvas - Comprehensive Implementation Plan

## Table of Contents
1. [Overview](#overview)
2. [Requirements](#requirements)
3. [Codex Review](#codex-review)
4. [API Verification Results](#api-verification-results-tested-2025-12-18)
5. [Open-Source Research Summary](#open-source-research-summary)
6. [Gap Analysis](#gap-analysis)
7. [Reference Links](#reference-links)
8. [Sample Data Structure](#sample-data-structure)
9. [TypeScript Interfaces](#typescript-interfaces)
10. [New Dependencies](#new-dependencies)
11. [File Structure](#file-structure)
12. [Component Implementations](#component-implementations)
13. [Content Parser](#content-parser)
14. [Styling Reference](#styling-reference)
15. [Implementation Phases](#implementation-phases)

---

## Overview

Create a Claude Canvas-style right side panel to display comprehensive log analysis summaries. The feature consists of:

1. **Preview Card**: A compact card shown in the chat bubble when a `master_summary` download link is available
2. **Canvas Panel**: A slide-in panel from the right side that displays the full parsed content
3. **Collapsible Sections**: Trace analysis accordion and timeline section that can be expanded/collapsed

### User Flow
1. Bot message includes a `master_summary` type download link
2. ChatBubble renders a `SummaryPreviewCard` instead of a regular download link
3. User clicks "View Analysis" button
4. System fetches content from the content API (JSON), not the download URL
5. Content is parsed into structured format
6. Right side panel slides in, displaying the parsed content
7. User can expand/collapse trace details and timeline
8. User clicks close button or presses Escape to dismiss

---

## Requirements

| Requirement | Decision |
|-------------|----------|
| Data Source | Fetch via `GET /content/?filename=...` on user click (keep `/download/?filename=...` for saving files) |
| Display Mode | Right side panel (overlay), chat remains visible |
| Panel Width | 500px on desktop, full width on mobile |
| Trace Display | Collapsible accordion, collapsed by default |
| Timeline Display | Collapsible section, collapsed by default |
| Theme Support | Dark/light mode via existing CSS variables |

---

## Codex Review

### Goal/UX fit
- Your stated requirement is “view in a modal after click instead of forcing download”. The plan currently targets a *right-side canvas panel*; that’s close (overlay viewer), but it’s not a true modal dialog pattern. Consider treating the “canvas” as an implementation detail and starting with a generic `FileViewerModal` (dialog overlay) that can later evolve into a right-side panel if desired.
- Keep a “Download” affordance inside the viewer (so users can still save the file), but make “View” the default action.

### API contract to hit (viewer)
The viewer should load file content from the backend content endpoint:

```bash
curl -X 'GET' \
  'http://localhost:8000/content/?filename=master_summary_20251218_121036.txt' \
  -H 'accept: application/json'
```

**Frontend implications / gaps to address in implementation:**
- Verified response shape: `200 OK`, `content-type: application/json`, JSON keys `filename` and `content`.
- Prefer `/content` for viewing because `/download` often returns `Content-Disposition: attachment` and may be served as a binary stream; `/content` is explicitly JSON (`{ filename, content }`) and more reliable for in-app rendering.
- Always `encodeURIComponent(filename)` (and/or `URLSearchParams`) when building the request URL; do not interpolate raw filenames.
- Handle `404` (missing file) and `413`/large payload cases gracefully in the UI (show error + keep “Download” as fallback).
- Ensure the backend allows CORS from the Vite dev origin (e.g., `http://localhost:5173`) for `GET /content` and `GET /download` if those are called directly from the browser.

### Fit with this repo (tech/style)
- This repo’s UI is primarily authored CSS (`src/*.css` + `src/components/*.css`) and does not currently use shadcn component patterns in production. The plan includes Tailwind-first classnames and a Radix wrapper file structure; that’s doable, but it will increase surface area and styling churn.
- For a fastest-path implementation, prefer **no new dependencies** and implement the modal (and accordion) using existing CSS variables + small, local components (you already have consistent glassmorphism tokens).

### Data/transport notes (based on the sample)
- The server may return either JSON (`{ filename, content }`) or a raw file response (`text/plain` or `application/octet-stream` with `Content-Disposition: attachment`). The fetch logic should handle both; if a blob is returned, convert via `await (await response.blob()).text()` as a fallback.
- `Recommendation:` values can be a plain sentence or appear JSON-like (array in a string). The `TraceAnalysis.recommendation: string | string[]` type is correct; ensure the parser attempts `JSON.parse` when it sees something like `[...]` and falls back to string when parsing fails.
- Timeline trace IDs are sometimes truncated with ellipses (`351a4864...`); treat them as display strings, not join keys.

### Integration notes (where to hook in)
- Today `ChatBubble` renders download “pills” that navigate to `/download/?filename=...`. The current plan only intercepts `master_summary` (via `SummaryPreviewCard`), but your requirement implies **more than one type** should be viewable (at minimum: `verification`, and likely `trace_analysis` + any text-based “relevant files” outputs). Decide which types/extensions open the viewer by default (e.g., `.txt`, `.log`, `.json`, `.md`) and keep a clear “Download” secondary action.
- If you keep the “preview card” concept, the “View Analysis” button should open the same viewer; don’t create a separate code path for it.
- Add cancellation/caching: use `AbortController` so closing the viewer cancels the in-flight `/content` fetch, and consider a simple in-memory cache keyed by `filename` to avoid refetching when users reopen the same artifact.

### Suggested plan tweaks
- Rename “Canvas Panel” → “Viewer (Modal/Panel)” to reflect the UX requirement.
- Make Phase 1 “Viewer shell + raw text rendering” (monospace `<pre>`, filename header, loading/error states, Escape/backdrop close).
- Defer the structured parser/accordion/timeline rendering until after the modal flow works end-to-end (it’s easier to validate transport, CORS, and content types first).

### Reference implementations (what to borrow / what to avoid)
- LibreChat “Artifacts”: Separate pane/window for rich artifacts; relevant takeaway is **clear separation between chat transcript and artifact viewer**, plus safety notes (CSP/sandboxing) if you ever render HTML/JS artifacts.
- Open WebUI “Tools Workspace”: Treats artifacts as first-class saved objects; takeaway is **artifact persistence + a place to revisit prior outputs**, beyond the transient chat bubble.
- Continue (VS Code side panel): Strong example of **side-panel React UI architecture** and message→UI rendering pipeline (even though it’s a VS Code webview).
- OpenHands: More IDE-like; useful inspiration for **split layout + multi-surface workflow**, but likely too heavy for this app’s current scope.
- AnythingLLM: Good reference for **workspace/thread scoping** if you later need “artifact lists per conversation”.
- If you want ChatGPT/Claude-style split panes later, consider adding resizable layout (`react-resizable-panels`) and an editor/preview surface (CodeMirror/Monaco) as a separate, future phase.

---

## API Verification Results (Tested 2025-12-18)

### Confirmed Response Format

```bash
curl -X 'GET' 'http://localhost:8000/content/?filename=master_summary_20251218_121036.txt' -H 'accept: application/json'
```

**Response (200 OK, Content-Type: application/json):**
```json
{
  "filename": "master_summary_20251218_121036.txt",
  "content": "COMPREHENSIVE BANKING LOG ANALYSIS - MASTER SUMMARY\n============================================================\nGenerated: 2025-12-18 12:10:36\nTotal Traces Analyzed: 5\nTotal Log Entries: 287\n..."
}
```

### Key Findings from API Testing

| Observation | Implication |
|-------------|-------------|
| Response is always JSON with `filename` and `content` | No need to handle blob/binary for `/content` endpoint |
| Content can be very large (287 log entries in test) | Consider virtualization for timeline |
| Timeline truncates: `... and 187 more entries` | Handle truncation gracefully; show indicator |
| ERROR level present alongside TRACE/WARN | Already handled in levelConfig |
| Recommendations format varies | Both `1. ... 2. ...` numbered lists and `['...', '...']` JSON arrays observed |
| Customer dispute can be free-form text | Parser handles `"find what happened to username frodo..."` format |

### URL Construction Pattern

```typescript
const apiUrl = import.meta.env.VITE_API_URL || "http://10.112.30.10:8000";
const contentUrl = new URL("/content/", apiUrl);
contentUrl.searchParams.set("filename", filename); // auto-encodes

const downloadUrl = new URL("/download/", apiUrl);
downloadUrl.searchParams.set("filename", filename);
```

---

## Open-Source Research Summary

### Panel Architecture Patterns (from LibreChat, Open WebUI, Continue, E2B)

| Project | Approach | Key Takeaway |
|---------|----------|--------------|
| **LibreChat** | Sandpack-based artifacts in separate pane | Clear chat/artifact separation; CSP for security |
| **Open WebUI** | Persistent artifact storage with versioning | Artifacts as first-class objects |
| **Continue** | React side panel in VS Code webview | Strong message→UI rendering pipeline |
| **E2B Fragments** | Next.js + shadcn/ui + real-time preview | Full-stack artifact generation |
| **Vercel ai-chatbot** | Generative UI with handler registry | Content type routing pattern |

### Why Side Panel Over Modal

- **Multitasking**: Users can reference chat while viewing artifacts
- **Comparison**: Side-by-side content viewing
- **Persistence**: Interaction without interruption
- **Scalability**: Better for high-volume content
- **User expectation**: Claude/ChatGPT canvas behavior

### Recommended Libraries (for future enhancement)

| Library | Purpose | Notes |
|---------|---------|-------|
| `react-resizable-panels` | Split pane layout | 5k stars, 12.8kb, accessible, persistence built-in |
| `framer-motion` | Animations | Best for React 19, AnimatePresence for exit animations |
| `react-markdown` | Markdown rendering | Plugin ecosystem, custom component mapping |
| `prism-react-renderer` | Syntax highlighting | Lazy-loadable per language |

### react-resizable-panels Pattern (Future Phase)

```jsx
<PanelGroup direction="horizontal">
  <Panel defaultSize={70} minSize={30}>
    {/* Chat */}
  </Panel>
  <PanelResizeHandle />
  <Panel id="viewer" defaultSize={30} minSize={20} collapsible>
    {/* Viewer Panel */}
  </Panel>
</PanelGroup>
```

---

## Gap Analysis

### Current Plan Gaps

| Gap | Risk | Mitigation |
|-----|------|------------|
| **No raw text fallback** | Parser failure = blank panel | Phase 1: Always show `<pre>` fallback with rawContent |
| **Timeline truncation** | API returns `... and N more entries` | Show "Showing X of Y entries" indicator |
| **Large content (287+ entries)** | Scroll performance | Future: Virtualize with `react-window` |
| **No resizable panel** | Fixed 500px may not suit all users | Future: Add `react-resizable-panels` |
| **Multi-line recommendations** | Numbered lists may not parse as arrays | Enhanced parser detects `1. ... 2. ...` pattern |
| **No artifact caching** | Re-fetch on every open | Future: Cache with React Query or in-memory map |
| **No fetch cancellation** | Closing panel leaves orphan request | Add AbortController support |
| **No keyboard nav in accordion** | Accessibility gap | Add Tab/Arrow key support |

### Parser Edge Cases (Verified from Real Data)

```typescript
// 1. Numbered recommendations (NOT JSON)
"Recommendation: 1. Cross-validate billing and biller data across all systems to ensure consistency.\n2. Implement additional logging..."

// 2. Array-in-string recommendations (JSON)
"Recommendation: ['Verify if additional context...', 'If system returns an error...']"

// 3. Free-form customer dispute (no "date is" / "username is")
"find what happened to username frodo on december 17, 2025"

// 4. Truncated timeline
"... and 187 more entries"

// 5. ERROR log level in timeline (in addition to TRACE/WARN)
"46. 2025-12-17 13:31:49.144 | ERROR | bs23-ib-rt-payment-service | cc442a67... | Error while checking..."
```

### Revised Implementation Priority

Based on Codex review recommendations:

1. **Phase 1: Viewer Shell** (validate transport first)
   - Overlay panel with raw `<pre>` display
   - Loading/error states
   - Escape/backdrop close
   - Download button inside viewer
   - AbortController for fetch cancellation

2. **Phase 2: Chat Integration**
   - Preview card in ChatBubble
   - `GET /content/?filename=...` fetch
   - Handle 404/error gracefully
   - Support multiple file types (master_summary, verification, trace_analysis)

3. **Phase 3: Structured Parser**
   - Parse metadata, traces, timeline
   - Handle all edge cases above
   - Fallback to raw on parse failure

4. **Phase 4: Rich UI**
   - Collapsible accordion
   - Timeline section
   - Score/level color coding

5. **Phase 5: Future Enhancements**
   - Resizable panels (`react-resizable-panels`)
   - Timeline virtualization
   - Artifact caching (in-memory or React Query)
   - Keyboard navigation

---

## Reference Links

### Open-Source Implementations
- [LibreChat](https://github.com/danny-avila/LibreChat) - Artifacts with Sandpack
- [Open WebUI](https://github.com/open-webui/open-webui) - Tools Workspace
- [Continue](https://github.com/continuedev/continue) - VS Code side panel
- [E2B Fragments](https://github.com/e2b-dev/fragments) - Claude Artifacts clone
- [Vercel ai-chatbot](https://github.com/vercel/ai-chatbot) - Generative UI
- [HuggingFace chat-ui](https://github.com/huggingface/chat-ui) - SvelteKit chat

### Building Blocks
- [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels)
- [framer-motion](https://motion.dev/docs/react-animation)
- [react-markdown](https://github.com/remarkjs/react-markdown)
- [prism-react-renderer](https://github.com/FormidableLabs/prism-react-renderer)
- [Sandpack](https://github.com/codesandbox/sandpack) - React sandboxing

---

## Sample Data Structure

**Endpoint (viewer):**
`GET <VITE_API_URL>/content/?filename=<filename>` (expects JSON)

The API returns:
```json
{
  "filename": "master_summary_20251218_120121.txt",
  "content": "COMPREHENSIVE BANKING LOG ANALYSIS - MASTER SUMMARY\n============================================================\n..."
}
```

### Content Format (Plain Text)

```
COMPREHENSIVE BANKING LOG ANALYSIS - MASTER SUMMARY
============================================================
Generated: 2025-12-18 12:01:21
Total Traces Analyzed: 22
Total Log Entries: 48
Analysis Model: phi4-mini-reasoning:latest
============================================================

ORIGINAL CUSTOMER DISPUTE
-------------------------
date is december 17, 2025
username is frodo

TRACE ANALYSIS SUMMARY
----------------------
TRACE 1: eebdd2958400732475b1292f28e5ab03
------------------------------
Relevance Score: 100/100
Transaction Status: Unknown
Key Finding: The resource ACCOUNT-PORTAL-SERVICE was not registered...
Recommendation: Investigate lease management and service registration protocols...

TRACE 2: a53f3a128295f1edbf7149dba7edfaec
------------------------------
...

COMPREHENSIVE TRANSACTION TIMELINE
----------------------------------
All log entries across all traces in chronological order:

  1. 2025-12-18 05:59:27.816 | TRACE | bs23-ib-notification-service | 351a4864... | Invoking...
  2. 2025-12-18 05:59:27.819 | TRACE | bs23-ib-notification-service | 351a4864... | Executed...
  ...

============================================================
END OF MASTER SUMMARY
============================================================
```

---

## TypeScript Interfaces

Add these to `src/types.ts`:

```typescript
// ============================================
// Summary Analysis Canvas Types
// ============================================

/**
 * Metadata extracted from the summary header
 */
export interface SummaryMetadata {
  filename: string;
  generatedDate: string;
  totalTraces: number;
  totalLogEntries: number;
  model: string;
}

/**
 * Customer dispute information
 */
export interface CustomerDispute {
  date: string;
  username: string;
}

/**
 * Individual trace analysis result
 */
export interface TraceAnalysis {
  traceNumber: number;
  traceId: string;
  relevanceScore: number;        // 0-100
  transactionStatus: string;     // "Unknown", "Success", "Failed", etc.
  keyFinding: string;
  recommendation: string | string[];
}

/**
 * Single entry in the transaction timeline
 */
export interface TimelineEntry {
  index: number;
  timestamp: string;             // "2025-12-18 05:59:27.816"
  level: 'INFO' | 'WARN' | 'ERROR' | 'TRACE' | 'DEBUG';
  service: string;
  traceId: string;
  message: string;
}

/**
 * Fully parsed summary content
 */
export interface ParsedSummaryContent {
  metadata: SummaryMetadata;
  customerDispute: CustomerDispute | null;
  traces: TraceAnalysis[];
  timeline: TimelineEntry[];
  rawContent: string;            // Original text for fallback display
}

/**
 * Canvas panel state
 */
export interface CanvasState {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  data: ParsedSummaryContent | null;
}
```

---

## New Dependencies

```bash
npm install @radix-ui/react-collapsible
```

This provides accessible collapsible components with animation support.

---

## File Structure

```
src/
├── components/
│   ├── canvas/
│   │   ├── index.ts                    # Barrel export
│   │   ├── SummaryCanvas.tsx           # Main panel container
│   │   ├── CanvasHeader.tsx            # Header with metadata + close button
│   │   ├── CanvasLoadingSkeleton.tsx   # Loading state skeleton
│   │   ├── CustomerDisputeSection.tsx  # Dispute info card
│   │   ├── TraceAccordion.tsx          # Container for all traces
│   │   ├── TraceAccordionItem.tsx      # Single trace (collapsible)
│   │   └── TimelineSection.tsx         # Timeline with log entries
│   ├── ui/
│   │   ├── collapsible.tsx             # NEW: Radix Collapsible wrapper
│   │   └── ... (existing)
│   ├── ChatBubble.tsx                  # MODIFY: Render preview card
│   ├── ChatInterface.tsx               # MODIFY: Add canvas state & panel
│   └── SummaryPreviewCard.tsx          # NEW: Preview card for chat bubble
├── lib/
│   ├── parseSummaryContent.ts          # NEW: Content parser
│   └── utils.ts                        # Existing
└── types.ts                            # MODIFY: Add new interfaces
```

---

## Component Implementations

### 1. `src/components/ui/collapsible.tsx`

```tsx
"use client";

import * as React from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { cn } from "../../lib/utils";

const Collapsible = CollapsiblePrimitive.Root;

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleContent>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>
>(({ className, children, ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleContent
    ref={ref}
    className={cn(
      "overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down",
      className
    )}
    {...props}
  >
    {children}
  </CollapsiblePrimitive.CollapsibleContent>
));
CollapsibleContent.displayName = "CollapsibleContent";

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
```

**Note**: Add these keyframes to `tailwind.config.cjs` if not present:
```js
keyframes: {
  "collapsible-down": {
    from: { height: "0" },
    to: { height: "var(--radix-collapsible-content-height)" },
  },
  "collapsible-up": {
    from: { height: "var(--radix-collapsible-content-height)" },
    to: { height: "0" },
  },
},
animation: {
  "collapsible-down": "collapsible-down 0.2s ease-out",
  "collapsible-up": "collapsible-up 0.2s ease-out",
},
```

---

### 2. `src/components/SummaryPreviewCard.tsx`

```tsx
import { FileText, ExternalLink } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";

interface SummaryPreviewCardProps {
  filename: string;
  url: string;
  onViewClick: () => void;
  className?: string;
}

export default function SummaryPreviewCard({
  filename,
  url,
  onViewClick,
  className,
}: SummaryPreviewCardProps) {
  // Extract date from filename: master_summary_20251218_120121.txt
  const dateMatch = filename.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  const formattedDate = dateMatch
    ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]} ${dateMatch[4]}:${dateMatch[5]}`
    : "Unknown date";

  return (
    <Card
      className={cn(
        "w-full border-primary/40 bg-primary/5 shadow-sm",
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="info" className="text-xs">
                Master Summary
              </Badge>
            </div>
            <p className="mt-1 truncate text-sm font-medium text-foreground">
              {filename}
            </p>
            <p className="text-xs text-muted-foreground">
              Generated: {formattedDate}
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={onViewClick}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View Analysis
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a href={url} download={filename} target="_blank" rel="noopener noreferrer">
              Download
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### 3. `src/components/canvas/SummaryCanvas.tsx`

```tsx
import { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import type { CanvasState } from "../../types";
import CanvasHeader from "./CanvasHeader";
import CanvasLoadingSkeleton from "./CanvasLoadingSkeleton";
import CustomerDisputeSection from "./CustomerDisputeSection";
import TraceAccordion from "./TraceAccordion";
import TimelineSection from "./TimelineSection";

interface SummaryCanvasProps {
  state: CanvasState;
  onClose: () => void;
}

export default function SummaryCanvas({ state, onClose }: SummaryCanvasProps) {
  const { isOpen, isLoading, error, data } = state;

  // Handle Escape key to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/20 transition-opacity duration-300",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-border bg-background shadow-2xl transition-transform duration-300 ease-out md:w-[500px]",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Summary Analysis"
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-10"
          onClick={onClose}
          aria-label="Close panel"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6 pb-20">
            {isLoading && <CanvasLoadingSkeleton />}

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
                <p className="font-medium">Failed to load summary</p>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            )}

            {data && !isLoading && (
              <div className="space-y-6">
                <CanvasHeader metadata={data.metadata} />

                {data.customerDispute && (
                  <CustomerDisputeSection dispute={data.customerDispute} />
                )}

                <TraceAccordion traces={data.traces} />

                <TimelineSection entries={data.timeline} />
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>
    </>
  );
}
```

---

### 4. `src/components/canvas/CanvasHeader.tsx`

```tsx
import { FileText, Calendar, Hash, Database, Cpu } from "lucide-react";
import { Badge } from "../ui/badge";
import type { SummaryMetadata } from "../../types";

interface CanvasHeaderProps {
  metadata: SummaryMetadata;
}

export default function CanvasHeader({ metadata }: CanvasHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-3">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-foreground">
            Analysis Summary
          </h2>
          <p className="truncate text-sm text-muted-foreground">
            {metadata.filename}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Generated:</span>
          <span className="font-medium">{metadata.generatedDate}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Cpu className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Model:</span>
          <span className="font-medium truncate">{metadata.model}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Traces:</span>
          <Badge variant="secondary">{metadata.totalTraces}</Badge>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Database className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Log entries:</span>
          <Badge variant="secondary">{metadata.totalLogEntries}</Badge>
        </div>
      </div>
    </div>
  );
}
```

---

### 5. `src/components/canvas/CanvasLoadingSkeleton.tsx`

```tsx
import { Skeleton } from "../ui/skeleton";

export default function CanvasLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-start gap-3">
        <Skeleton className="h-14 w-14 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>

      {/* Sections skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}
```

---

### 6. `src/components/canvas/CustomerDisputeSection.tsx`

```tsx
import { User, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { CustomerDispute } from "../../types";

interface CustomerDisputeSectionProps {
  dispute: CustomerDispute;
}

export default function CustomerDisputeSection({
  dispute,
}: CustomerDisputeSectionProps) {
  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-amber-700 dark:text-amber-300">
          <User className="h-4 w-4" />
          Original Customer Dispute
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Date:</span>
          <span className="font-medium">{dispute.date}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Username:</span>
          <span className="font-medium">{dispute.username}</span>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### 7. `src/components/canvas/TraceAccordion.tsx`

```tsx
import { useState } from "react";
import { ChevronDown, Activity } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { cn } from "../../lib/utils";
import type { TraceAnalysis } from "../../types";
import TraceAccordionItem from "./TraceAccordionItem";

interface TraceAccordionProps {
  traces: TraceAnalysis[];
}

export default function TraceAccordion({ traces }: TraceAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (traces.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted",
            isOpen && "rounded-b-none border-b-0"
          )}
        >
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-semibold">Trace Analysis</span>
            <span className="text-sm text-muted-foreground">
              ({traces.length} traces)
            </span>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="rounded-b-lg border border-t-0 border-border bg-card">
          <div className="divide-y divide-border">
            {traces.map((trace) => (
              <TraceAccordionItem key={trace.traceId} trace={trace} />
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
```

---

### 8. `src/components/canvas/TraceAccordionItem.tsx`

```tsx
import { useState } from "react";
import { ChevronRight, AlertCircle, CheckCircle, HelpCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import type { TraceAnalysis } from "../../types";

interface TraceAccordionItemProps {
  trace: TraceAnalysis;
}

// Color coding for relevance scores
const getScoreColor = (score: number): string => {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10";
  if (score >= 60) return "text-amber-600 dark:text-amber-400 bg-amber-500/10";
  if (score >= 40) return "text-orange-600 dark:text-orange-400 bg-orange-500/10";
  return "text-red-600 dark:text-red-400 bg-red-500/10";
};

// Status icon mapping
const getStatusIcon = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes("success") || normalized.includes("resolved")) {
    return <CheckCircle className="h-4 w-4 text-emerald-500" />;
  }
  if (normalized.includes("error") || normalized.includes("fail")) {
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  }
  return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
};

export default function TraceAccordionItem({ trace }: TraceAccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  const truncatedId = trace.traceId.length > 16
    ? `${trace.traceId.slice(0, 8)}...${trace.traceId.slice(-4)}`
    : trace.traceId;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50">
          <ChevronRight
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-90"
            )}
          />
          <div className="flex flex-1 items-center gap-3 min-w-0">
            <span className="shrink-0 text-xs text-muted-foreground">
              #{trace.traceNumber}
            </span>
            <code className="truncate text-xs font-mono text-muted-foreground">
              {truncatedId}
            </code>
            <Badge
              variant="outline"
              className={cn("shrink-0 text-xs font-semibold", getScoreColor(trace.relevanceScore))}
            >
              {trace.relevanceScore}/100
            </Badge>
            <div className="flex items-center gap-1 shrink-0">
              {getStatusIcon(trace.transactionStatus)}
              <span className="text-xs text-muted-foreground">
                {trace.transactionStatus}
              </span>
            </div>
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-3 bg-muted/30 px-4 py-3 pl-11">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Key Finding
            </p>
            <p className="mt-1 text-sm leading-relaxed">{trace.keyFinding}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Recommendation
            </p>
            {Array.isArray(trace.recommendation) ? (
              <ul className="mt-1 list-inside list-disc space-y-1 text-sm leading-relaxed">
                {trace.recommendation.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm leading-relaxed">{trace.recommendation}</p>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
```

---

### 9. `src/components/canvas/TimelineSection.tsx`

```tsx
import { useState } from "react";
import { ChevronDown, Clock } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "../../lib/utils";
import type { TimelineEntry } from "../../types";

interface TimelineSectionProps {
  entries: TimelineEntry[];
}

// Color coding for log levels
const levelConfig: Record<TimelineEntry["level"], { bg: string; text: string }> = {
  ERROR: { bg: "bg-red-500/10", text: "text-red-700 dark:text-red-300" },
  WARN: { bg: "bg-amber-500/10", text: "text-amber-700 dark:text-amber-300" },
  INFO: { bg: "bg-blue-500/10", text: "text-blue-700 dark:text-blue-300" },
  DEBUG: { bg: "bg-gray-500/10", text: "text-gray-600 dark:text-gray-400" },
  TRACE: { bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400" },
};

export default function TimelineSection({ entries }: TimelineSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (entries.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted",
            isOpen && "rounded-b-none border-b-0"
          )}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="font-semibold">Transaction Timeline</span>
            <span className="text-sm text-muted-foreground">
              ({entries.length} entries)
            </span>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="rounded-b-lg border border-t-0 border-border bg-card">
          <ScrollArea className="h-[400px]">
            <div className="divide-y divide-border">
              {entries.map((entry) => {
                const config = levelConfig[entry.level] || levelConfig.INFO;
                const truncatedTraceId = entry.traceId.length > 8
                  ? `${entry.traceId.slice(0, 8)}...`
                  : entry.traceId;

                return (
                  <div
                    key={entry.index}
                    className="flex items-start gap-3 px-4 py-2 text-xs"
                  >
                    <span className="shrink-0 w-6 text-right text-muted-foreground">
                      {entry.index}.
                    </span>
                    <span className="shrink-0 w-24 font-mono text-muted-foreground">
                      {entry.timestamp.split(" ")[1] || entry.timestamp}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 w-14 justify-center text-[10px] font-semibold",
                        config.bg,
                        config.text
                      )}
                    >
                      {entry.level}
                    </Badge>
                    <span className="shrink-0 w-32 truncate text-muted-foreground">
                      {entry.service}
                    </span>
                    <code className="shrink-0 w-20 font-mono text-muted-foreground">
                      {truncatedTraceId}
                    </code>
                    <span className="flex-1 truncate" title={entry.message}>
                      {entry.message}
                    </span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
```

---

### 10. `src/components/canvas/index.ts`

```typescript
export { default as SummaryCanvas } from "./SummaryCanvas";
export { default as CanvasHeader } from "./CanvasHeader";
export { default as CanvasLoadingSkeleton } from "./CanvasLoadingSkeleton";
export { default as CustomerDisputeSection } from "./CustomerDisputeSection";
export { default as TraceAccordion } from "./TraceAccordion";
export { default as TraceAccordionItem } from "./TraceAccordionItem";
export { default as TimelineSection } from "./TimelineSection";
```

---

## Content Parser

### `src/lib/parseSummaryContent.ts`

```typescript
import type {
  ParsedSummaryContent,
  SummaryMetadata,
  CustomerDispute,
  TraceAnalysis,
  TimelineEntry,
} from "../types";

/**
 * Parse raw summary content text into structured format
 */
export function parseSummaryContent(
  rawContent: string,
  filename: string
): ParsedSummaryContent {
  const lines = rawContent.split("\n");

  return {
    metadata: parseMetadata(lines, filename),
    customerDispute: parseCustomerDispute(lines),
    traces: parseTraces(lines),
    timeline: parseTimeline(lines),
    rawContent,
  };
}

/**
 * Extract metadata from header section
 */
function parseMetadata(lines: string[], filename: string): SummaryMetadata {
  const findValue = (pattern: RegExp): string => {
    for (const line of lines) {
      const match = line.match(pattern);
      if (match) return match[1].trim();
    }
    return "";
  };

  return {
    filename,
    generatedDate: findValue(/Generated:\s*(.+)/i) || extractDateFromFilename(filename),
    totalTraces: parseInt(findValue(/Total Traces.*?:\s*(\d+)/i) || "0", 10),
    totalLogEntries: parseInt(findValue(/Total Log Entries:\s*(\d+)/i) || "0", 10),
    model: findValue(/Analysis Model:\s*(.+)/i) || "Unknown",
  };
}

/**
 * Extract date from filename pattern: master_summary_YYYYMMDD_HHMMSS.txt
 */
function extractDateFromFilename(filename: string): string {
  const match = filename.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:${match[6]}`;
  }
  return "Unknown";
}

/**
 * Parse customer dispute section
 */
function parseCustomerDispute(lines: string[]): CustomerDispute | null {
  let inSection = false;
  let date = "";
  let username = "";

  for (const line of lines) {
    if (line.includes("ORIGINAL CUSTOMER DISPUTE")) {
      inSection = true;
      continue;
    }
    if (inSection && line.match(/^[A-Z]{2,}/)) {
      // Hit next section header
      break;
    }
    if (inSection) {
      const dateMatch = line.match(/date\s+is\s+(.+)/i);
      const userMatch = line.match(/username\s+is\s+(.+)/i);
      if (dateMatch) date = dateMatch[1].trim();
      if (userMatch) username = userMatch[1].trim();
    }
  }

  if (date || username) {
    return { date, username };
  }
  return null;
}

/**
 * Parse trace analysis section
 */
function parseTraces(lines: string[]): TraceAnalysis[] {
  const traces: TraceAnalysis[] = [];
  let inSection = false;
  let currentTrace: Partial<TraceAnalysis> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes("TRACE ANALYSIS SUMMARY")) {
      inSection = true;
      continue;
    }

    if (inSection && line.includes("TRANSACTION TIMELINE")) {
      // Save last trace and exit
      if (currentTrace?.traceId) {
        traces.push(currentTrace as TraceAnalysis);
      }
      break;
    }

    if (inSection) {
      // Match "TRACE N: <traceId>"
      const traceHeaderMatch = line.match(/^TRACE\s+(\d+):\s*([a-f0-9]+)/i);
      if (traceHeaderMatch) {
        // Save previous trace
        if (currentTrace?.traceId) {
          traces.push(currentTrace as TraceAnalysis);
        }
        currentTrace = {
          traceNumber: parseInt(traceHeaderMatch[1], 10),
          traceId: traceHeaderMatch[2],
          relevanceScore: 0,
          transactionStatus: "Unknown",
          keyFinding: "",
          recommendation: "",
        };
        continue;
      }

      if (currentTrace) {
        // Match "Relevance Score: N/100"
        const scoreMatch = line.match(/Relevance Score:\s*(\d+)/i);
        if (scoreMatch) {
          currentTrace.relevanceScore = parseInt(scoreMatch[1], 10);
          continue;
        }

        // Match "Transaction Status: X"
        const statusMatch = line.match(/Transaction Status:\s*(.+)/i);
        if (statusMatch) {
          currentTrace.transactionStatus = statusMatch[1].trim();
          continue;
        }

        // Match "Key Finding: X"
        const findingMatch = line.match(/Key Finding:\s*(.+)/i);
        if (findingMatch) {
          currentTrace.keyFinding = findingMatch[1].trim();
          continue;
        }

        // Match "Recommendation: X"
        const recMatch = line.match(/Recommendation:\s*(.+)/i);
        if (recMatch) {
          const recValue = recMatch[1].trim();
          // Check if it's a JSON array
          if (recValue.startsWith("[")) {
            try {
              currentTrace.recommendation = JSON.parse(recValue);
            } catch {
              currentTrace.recommendation = recValue;
            }
          } else {
            currentTrace.recommendation = recValue;
          }
          continue;
        }
      }
    }
  }

  return traces;
}

/**
 * Parse timeline section
 */
function parseTimeline(lines: string[]): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  let inSection = false;

  for (const line of lines) {
    if (line.includes("TRANSACTION TIMELINE") || line.includes("COMPREHENSIVE TRANSACTION TIMELINE")) {
      inSection = true;
      continue;
    }

    if (inSection && line.includes("END OF MASTER SUMMARY")) {
      break;
    }

    if (inSection) {
      // Match numbered entries: "  1. 2025-12-18 05:59:27.816 | TRACE | service | traceId | message"
      const entryMatch = line.match(
        /^\s*(\d+)\.\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d{3})\s*\|\s*(\w+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(.+)/
      );

      if (entryMatch) {
        entries.push({
          index: parseInt(entryMatch[1], 10),
          timestamp: entryMatch[2].trim(),
          level: normalizeLevel(entryMatch[3].trim()),
          service: entryMatch[4].trim(),
          traceId: entryMatch[5].trim().replace(/\.\.\.$/, ""),
          message: entryMatch[6].trim(),
        });
      }
    }
  }

  return entries;
}

/**
 * Normalize log level string to valid type
 */
function normalizeLevel(level: string): TimelineEntry["level"] {
  const normalized = level.toUpperCase();
  if (["INFO", "WARN", "ERROR", "TRACE", "DEBUG"].includes(normalized)) {
    return normalized as TimelineEntry["level"];
  }
  return "INFO";
}
```

---

## Modifications to Existing Files

### 1. `src/components/ChatBubble.tsx`

**Add import:**
```tsx
import SummaryPreviewCard from "./SummaryPreviewCard";
```

**Add prop to component:**
```tsx
type ChatBubbleProps = {
  message: Message;
  index: number;
  downloadLinks?: DownloadLink[];
  onViewAnalysis?: (filename: string) => void;  // ADD THIS
};
```

**Update function signature:**
```tsx
export default function ChatBubble({
  message,
  index: _index,
  downloadLinks = [],
  onViewAnalysis,  // ADD THIS
}: ChatBubbleProps) {
```

**Modify the grouped links rendering (replace lines 104-136):**
```tsx
{Object.entries(groupedLinks).map(([category, links]) => {
  // Special handling for master_summary - render preview card
  if (category === "master_summary" && links.length > 0) {
    return (
      <SummaryPreviewCard
        key={category}
        filename={links[0].name}
        url={links[0].url}
        onViewClick={() => onViewAnalysis?.(links[0].name)}
      />
    );
  }

  // Default handling for other categories
  const config =
    categoryConfig[category as DownloadLink["type"]] ??
    categoryConfig.relevant;
  return (
    <div
      key={category}
      className={cn(
        "w-full rounded-xl border px-3 py-3 shadow-sm",
        config.tone,
      )}
    >
      {/* ... existing download link grid code ... */}
    </div>
  );
})}
```

---

### 2. `src/components/ChatInterface.tsx`

**Add imports:**
```tsx
import { useState, useCallback } from "react";
import { SummaryCanvas } from "./canvas";
import { parseSummaryContent } from "../lib/parseSummaryContent";
import type { CanvasState } from "../types";
```

**Add state (near other useState calls):**
```tsx
const [canvas, setCanvas] = useState<CanvasState>({
  isOpen: false,
  isLoading: false,
  error: null,
  data: null,
});
```

**Add handler functions:**
```tsx
const openCanvas = useCallback(async (filename: string) => {
  setCanvas({
    isOpen: true,
    isLoading: true,
    error: null,
    data: null,
  });

  try {
    const apiUrl =
      import.meta.env.VITE_API_URL || "http://10.112.30.10:8000";
    const contentUrl = new URL("/content/", apiUrl);
    contentUrl.searchParams.set("filename", filename);

    const response = await fetch(contentUrl, {
      headers: { accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Handle both JSON and plain text responses
    const contentType = response.headers.get("content-type");
    let content: string;

    if (contentType?.includes("application/json")) {
      const json = await response.json();
      content = json.content || JSON.stringify(json);
    } else {
      content = await response.text();
    }

    const parsed = parseSummaryContent(content, filename);
    setCanvas((prev) => ({
      ...prev,
      isLoading: false,
      data: parsed,
    }));
  } catch (error) {
    setCanvas((prev) => ({
      ...prev,
      isLoading: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }));
  }
}, []);

const closeCanvas = useCallback(() => {
  setCanvas({
    isOpen: false,
    isLoading: false,
    error: null,
    data: null,
  });
}, []);
```

**Pass handler to ChatBubble:**
```tsx
<ChatBubble
  key={idx}
  message={msg}
  index={idx}
  downloadLinks={msg.downloadLinks}
  onViewAnalysis={openCanvas}  // ADD THIS
/>
```

**Render SummaryCanvas (at root level, outside the scrollable chat area):**
```tsx
return (
  <div className="relative flex h-screen flex-col">
    {/* ... existing chat UI ... */}

    <SummaryCanvas state={canvas} onClose={closeCanvas} />
  </div>
);
```

---

## Styling Reference

### Relevance Score Colors (TraceAccordionItem)
| Score Range | Tailwind Classes |
|-------------|------------------|
| 80-100 | `text-emerald-600 dark:text-emerald-400 bg-emerald-500/10` |
| 60-79 | `text-amber-600 dark:text-amber-400 bg-amber-500/10` |
| 40-59 | `text-orange-600 dark:text-orange-400 bg-orange-500/10` |
| 0-39 | `text-red-600 dark:text-red-400 bg-red-500/10` |

### Log Level Colors (TimelineSection)
| Level | Background | Text |
|-------|------------|------|
| ERROR | `bg-red-500/10` | `text-red-700 dark:text-red-300` |
| WARN | `bg-amber-500/10` | `text-amber-700 dark:text-amber-300` |
| INFO | `bg-blue-500/10` | `text-blue-700 dark:text-blue-300` |
| DEBUG | `bg-gray-500/10` | `text-gray-600 dark:text-gray-400` |
| TRACE | `bg-slate-500/10` | `text-slate-600 dark:text-slate-400` |

### Panel Animation
```css
/* Closed state */
transform: translateX(100%);

/* Open state */
transform: translateX(0);

/* Transition */
transition: transform 300ms ease-out;
```

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Add interfaces to `src/types.ts`
- [ ] Run `npm install @radix-ui/react-collapsible`
- [ ] Create `src/components/ui/collapsible.tsx`
- [ ] Update `tailwind.config.cjs` with collapsible animations
- [ ] Create `src/lib/parseSummaryContent.ts`

### Phase 2: Canvas Shell
- [ ] Create `src/components/canvas/` directory
- [ ] Create `SummaryCanvas.tsx`
- [ ] Create `CanvasHeader.tsx`
- [ ] Create `CanvasLoadingSkeleton.tsx`
- [ ] Add canvas state to `ChatInterface.tsx`
- [ ] Test panel open/close

### Phase 3: Canvas Content
- [ ] Create `CustomerDisputeSection.tsx`
- [ ] Create `TraceAccordion.tsx`
- [ ] Create `TraceAccordionItem.tsx`
- [ ] Create `TimelineSection.tsx`
- [ ] Create `index.ts` barrel export
- [ ] Wire components into `SummaryCanvas.tsx`

### Phase 4: Chat Integration
- [ ] Create `SummaryPreviewCard.tsx`
- [ ] Modify `ChatBubble.tsx` to render preview card
- [ ] Add `onViewAnalysis` prop drilling
- [ ] Implement `GET /content/?filename=...` fetch logic (fallback to download)
- [ ] Test full flow

### Phase 5: Polish
- [ ] Test with actual API data
- [ ] Refine parser for edge cases
- [ ] Test dark/light theme
- [ ] Test responsive (mobile)
- [ ] Add keyboard navigation
- [ ] Error boundary for parsing failures

---

## Testing Checklist

- [ ] Panel opens when "View Analysis" clicked
- [ ] Panel closes on close button click
- [ ] Panel closes on Escape key
- [ ] Panel closes on backdrop click
- [ ] Loading skeleton shows during fetch
- [ ] Error state displays on fetch failure
- [ ] Trace accordion expands/collapses
- [ ] Individual traces expand/collapse
- [ ] Timeline section expands/collapses
- [ ] Relevance scores show correct colors
- [ ] Log levels show correct colors
- [ ] Dark mode works correctly
- [ ] Mobile responsive (full width panel)
- [ ] Download button still works on preview card
