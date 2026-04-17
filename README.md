# GPT Visualizer Chrome Extension

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Chrome Web Store](https://img.shields.io/badge/Chrome%20Extension-v1.0.1-success)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vite](https://img.shields.io/badge/Vite-5-purple)

## Overview

**GPT Visualizer** is an extension that transforms your GPT conversations into interactive visual representations. Built with modern technologies (Vite, React, TypeScript), it provides a lightweight and extensible UI for analyzing and visualizing conversation flows, message hierarchies, and interaction patterns.

Perfect for developers, researchers, and power users who want to better understand and analyze GPT conversation structures.

## ✨ Features

- 🎨 **Interactive Chat Visualization** - Visual representation of conversation trees and message flows
- ⚡ **Performance Optimized** - Built with Vite for fast builds and hot module replacement
- 🎭 **Theme Support** - Customizable theming system for personalized experience


## 🚀 Quick Start

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


## 🛠 Development & Testing

### Scripts
| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server with hot reload |
| `npm run dev:watch` | Watch mode for faster rebuild cycles |
| `npm run build` | Production build to `dist/` |
| `npm run test` | Run Vitest test suite |
| `npm run test:ui` | Start Vitest UI dashboard |

## 📁 Project Structure
- `manifest.json` - Chrome extension manifest with permissions and metadata
- `src/background/` - Background/service worker scripts for extension logic
- `src/content/` - Content scripts injected into web pages
- `src/scripts/` - Shared helper utilities and utilities
- `src/ui/` - React app UI layer and component library
  - `src/ui/features/` - Feature-specific UI modules
  - `src/ui/themes/` - Theme configuration and styling
- `src/assets/` - Static assets (icons, images)

## 🏗 Architecture & Design Patterns

### Separation of Concerns
- **Extension Logic** (`src/background`, `src/content`) - Isolated from UI layer
- **UI Components** (`src/ui`) - React-based, reusable, and testable
- **Shared Utilities** (`src/scripts`) - Common helper functions

### Technology Stack
| Layer | Technology | Version |
|-------|-----------|---------|
| Build Tool | Vite | 5+ |
| Framework | React | 18+ |
| Language | TypeScript | 5+ |
| UI Components | Ant Design (antd) | Latest |
| Testing | Vitest | Latest |
| Linting | ESLint | 9+ |
| Bundler | @crxjs/vite-plugin | Latest |

## 📋 Development Guidelines

### Code Style
- Use React **functional components** exclusively
- Maintain **TypeScript** type safety throughout
- Keep extension script logic separate from UI
- Store tests adjacent to source files (`.test.js`/`.test.jsx`)
- Apply scoped CSS per feature folder (`src/ui/features/*/`)

### Component Development
- Leverage Ant Design components for consistent UI
- Keep components focused and single-responsibility
- Use proper prop typing and JSDoc comments
- Write unit tests for complex logic

### Testing Best Practices
- Write tests alongside source code
- Aim for meaningful test coverage
- Use Vitest for fast, modern testing
- Run `npm run test:ui` for interactive debugging

## 🔒 Security & Maintenance

### Known Issues
- **Build Dependency Alert**: A transitive high-severity advisory exists in `rollup` via `@crxjs/vite-plugin` (CVE: path traversal in versions <2.80.0). This affects the build toolchain but **not** the extension runtime code.
- **Mitigation**: Monitor upstream releases for patches to `@crxjs/vite-plugin` with updated `rollup` dependency
- **Action**: Run `npm audit` before each release to verify security status

### Dependency Management
- Keep dependencies up-to-date with `npm update`
- Review security advisories with `npm audit`
- Test thoroughly after dependency updates

## 🔄 Extension Workflow

1. **Development** → Code changes with hot reload (`npm run dev`)
2. **Testing** → Run tests (`npm run test`) and lint (`npm run lint`)
3. **Local Testing** → Load unpacked in Chrome, test in browser
4. **Build** → Create production bundle (`npm run build`)
5. **Reload** → If behavior changes, rebuild and reload in Chrome

**💡 Tip**: Enable Chrome's extension auto-reload or use a dev tool extension for faster iteration.

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:
1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request with detailed description
5. Ensure all tests pass and linting is clean

## 📝 Testing Guide

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for detailed testing documentation and best practices.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📧 Support

For issues, questions, or suggestions:
- Open an [Issue](../../issues)
- Check [existing documentation](./TESTING_GUIDE.md)
- Review the [copilot-instructions.md](./.github/copilot-instructions.md) for development guidelines
