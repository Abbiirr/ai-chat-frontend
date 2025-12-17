# Shadcn + Tailwind Migration Plan

- Inventory and setup: confirm Tailwind config and Vite pipeline; add `tailwind.config.js`, `postcss.config.js`, and base `globals.css` with shadcn presets; pick a shadcn theme scale (spacing, radius, typography).
- Install shadcn/ui: add `@radix-ui` deps plus `class-variance-authority`, `tailwind-merge`, `lucide-react`; scaffold core components via shadcn CLI (button, input, textarea, select, dropdown, badge, card, toggle, tooltip, skeleton).
- Theming: configure Tailwind CSS variables for light and dark; add a shadcn `ThemeProvider` with system detection and manual toggle; persist the choice to `localStorage` under `chat-theme` for compatibility with the current app.
- Layout rewrite: replace authored CSS in `App.css`, `ChatInterface.css`, `ChatInput.css`, `ChatBubble.css`, `ToolButton.css` with Tailwind utility classes; keep `variables.css` only if non-theme constants remain, otherwise remove after port; move global backgrounds and gradients into Tailwind `@layer base`.
- Component mapping:
  - `App`: wrap with `ThemeProvider`, add a theme toggle, use Tailwind for the shell layout.
  - `ChatInterface`: rebuild header, welcome state, message list, and sticky footer with shadcn `Card`/`ScrollArea`; keep scroll-to-bottom behavior.
  - `ChatBubble`: use `Card` and `Badge` variants for user/bot roles and download pills; add streaming typing indicator with `Skeleton` or custom dots.
  - `ChatInput`: use shadcn `Textarea`, `Button`, `Select` for the message and selectors; render param pills with `Badge`.
  - `ToolButton`: reimplement as a `DropdownMenu` trigger using a shadcn `Button` icon variant.
  - Downloads: reuse `Badge` or ghost `Button` for download links; optionally retire or refit `DownloadLink` with shadcn primitives.
- Styling choices: define a concise palette (e.g., slate + indigo for light, slate + emerald for dark), radius scale, and a glass/gradient backdrop using Tailwind utilities; ensure focus rings and motion-reduction fallbacks.
- Cleanup: remove unused CSS files and Tailwind directives from `index.css`; update imports to the new `globals.css`; avoid conflicting class names.
- Accessibility and UX: ensure keyboard navigation for dropdowns/selects; keep SSE streaming visuals clear; preserve existing non-ASCII icons where intentional.
- Validation: run `npm run lint` and `npm run build`; smoke-test light/dark toggle, message streaming, dropdown selections, and download links.
