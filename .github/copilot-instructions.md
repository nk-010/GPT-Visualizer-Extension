# Copilot Workspace Instructions

## Project overview
This repo is a Chrome extension that turns ChatGPT conversations into a visual graph of message flow, history, and editing behavior. The app is built with Vite + React and uses `@crxjs/vite-plugin` for extension bundling.

## Architecture and key entry points
- `manifest.json`: Chrome extension manifest. This is the source of truth for permissions, side panel configuration, content script injection, and web-accessible resources.
- `src/background/index.js`: background/service worker code. Keep lifecycle and messaging logic here.
- `src/content/index.js`: page-level script injected into `https://chat.openai.com/*` and `https://chatgpt.com/*` to extract data from the live page.
- `src/scripts/fetch.js`: shared helper code used by extension scripts; prefer reusing it rather than duplicating fetch logic.
- `src/ui/`: React UI for the side panel and chat visualizer.
- `src/ui/features/`: feature-level components and styles. Follow the existing breakdown under `chat` and `layout`.
- `src/ui/themes/themeConfig.js`: shared theme tokens and palette settings.

## Working conventions
- Use React functional components and keep UI logic in `src/ui` unless it truly belongs to a browser-extension runtime layer.
- Keep the extension runtime, page script, and UI separate. Do not mix page-specific logic into React components unless the behavior is required for rendering.
- Preserve the existing feature-folder pattern: component + CSS alongside the feature, not in a one-off global stylesheet unless it is truly shared.
- Tests belong next to the source files they validate, using Vitest. Prefer existing patterns in `src/**/*.test.*`.
- If you change permissions, host matches, or extension APIs, update `manifest.json` and verify the runtime still matches the extension’s actual behavior.
- Prefer minimal, targeted edits. The repo is small and extension-specific behaviors are easy to break if changes are broad.

## Development workflow
1. Install dependencies:
   - `npm install`
2. Start local development:
   - `npm run dev`
3. For faster reload cycles during extension work:
   - `npm run dev:watch`
4. Build the extension bundle:
   - `npm run build`
5. Test and lint:
   - `npm run test -- --run`
   - `npm run lint`

## Chrome extension-specific guidance
- Load the unpacked build from the generated `dist/` folder in Chrome, not directly from `src/`.
- Manifest and content-script changes require a rebuild and extension reload in Chrome.
- The extension targets OpenAI/ChatGPT domains only; keep host permissions and match patterns aligned with the actual behavior.
- Side-panel logic is initiated from the React app and browser runtime messaging, so both sides need to stay in sync.

## Common pitfalls
- Do not assume a browser-only UI can safely access page state without going through the extension content script flow.
- Avoid large refactors in a single change; this repo’s extension wiring is compact but sensitive to runtime boundaries.
- If a change affects UI, background, or manifest behavior together, validate the whole integration path rather than only the component in isolation.

## Suggested Copilot workflow
- For feature work, start in `src/ui/features/` and keep the feature structure consistent with the existing layout.
- For page/extension integration work, validate `manifest.json`, `src/content/index.js`, and the relevant browser messages together.
- When adding tests, keep them colocated with the module under test and prefer checks that exercise real behavior over mock-heavy assertions.

---
