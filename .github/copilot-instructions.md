# Copilot Workspace Instructions

## Project overview
This repo contains a Chrome Extension built with Vite + React + TypeScript-like React JSX and uses `@crxjs/vite-plugin` for extension bundling. The extension code is in `src/` with typed components under `src/ui` and extension entrypoints under `src/background`, `src/content`, and `src/scripts`.

### Key folders
- `src/background`: extension background scripts and service worker logic.
- `src/content`: content scripts injected into web pages.
- `src/scripts`: shared helper code used by extension scripts.
- `src/ui`: React app and UI components for extension popup/pages.
- `public/manifest.json`: Chrome extension manifest and permissions.

## Quick start
1. Open terminal in `gpt_visualizer`.
2. Install dependencies:
   - `npm install`
3. Run development build + local dev server:
   - `npm run dev`
4. Load extension in Chrome for local development:
   - Open `chrome://extensions`
   - Enable Developer mode
   - Click "Load unpacked" and select the `gpt_visualizer/dist` folder (or follow plugin-specific dev instructions if using dynamic dev mode)

## Run and test
- `npm run dev` — run Vite development server for extension front-end (hot reload)
- `npm run build` — production build to `dist/`
- `npm run preview` — preview built extension package
- `npm run lint` — run ESLint checks
- `npm run test` — run Vitest suite
- `npm run test:ui` — run Vitest UI runner

## Architecture and conventions
- Use React + function components in `src/ui`.
- Keep extension-specific logic in `src/background`, `src/content`, and `src/scripts`.
- Tests reside next to code (`.test.js` files) and run with Vitest.
- Keep styling scoped per feature folder (`src/ui/features/*` and `src/ui/App.css`).

## Suggested Copilot workflows
- To add a new feature, modify `src/ui/features/`, then update UI route/outlet in `src/ui/App.jsx`.
- For background and content script changes, update `public/manifest.json` and validate the required permissions.
- When adding new tests, keep them in the same directory as related files with `.test.jsx` or `.test.js`.

## Troubleshooting
- If extension changes are not reflected, rebuild and reload in Chrome.
- For manifest or extension API issues, verify `manifest.json` version and permission scopes.
- If tests fail due to environment, run `npm run test -- --run` to isolate failing tests.

---
