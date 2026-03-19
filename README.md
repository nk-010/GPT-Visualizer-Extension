# GPT Visualizer Chrome Extension

A private repo for a Vite + React Chrome extension that visualizes GPT conversation data and provides a lightweight UI.


### 1) Install dependencies
```bash
npm install
```

### 2) Run local dev server
```bash
npm run dev
```

### 2b) Rapid watch-build mode
```bash
npm run dev:watch
```
This runs Vite in watch mode and rebuilds automatically on file changes for faster extension reload cycles.

### 3) Load in Chrome for extension testing
1. Open `chrome://extensions`
2. Enable Developer mode
3. Click `Load unpacked`
4. Select this repo’s `gpt_visualizer/dist` folder

### 4) Build production package
```bash
npm run build
```

### 5) Preview built app
```bash
npm run preview
```

## Tests and quality checks
- `npm run test` — run Vitest tests
- `npm run test:ui` — start Vitest UI
- `npm run lint` — run ESLint

## Project Structure
- `public/manifest.json`: Chrome extension manifest
- `src/background`: background/service worker scripts
- `src/content`: content scripts injected into pages
- `src/scripts`: shared helper logic
- `src/ui`: React app UI and feature components
- `src/ui/features`: feature-specific UI modules

## 🔧 Development Notes
- Use React functional components and keep UI separate from extension script logic.
- This project uses Ant Design (`antd`) for UI components and theming in `src/ui`.
- Keep tests close to source files (`.test.js`/`.test.jsx`).
- If extension behavior changes, rebuild and reload in Chrome.

## ⚠️ Security & Dependencies
- **Known advisory**: A transitive high-severity advisory exists in `rollup` via `@crxjs/vite-plugin` (CVE: path traversal in versions <2.80.0). This affects the build toolchain but not the extension runtime code. Monitor upstream releases for a patch to `@crxjs/vite-plugin` with updated `rollup` dependency. Run `npm audit` before each release to verify status.
