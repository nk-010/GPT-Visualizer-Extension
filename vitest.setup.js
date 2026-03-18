import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Chrome API
global.chrome = {
  runtime: {
    onInstalled: {
      addListener: vi.fn()
    },
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    sendMessage: vi.fn(),
    getURL: vi.fn((path) => `chrome-extension://mock-id/${path}`),
    lastError: null,
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn(),
    reload: vi.fn(),
    onActivated: {
      addListener: vi.fn()
    },
    get: vi.fn()
  },
  sidePanel: {
    setPanelBehavior: vi.fn().mockReturnValue(Promise.resolve())
  },
  scripting: {
    executeScript: vi.fn()
  },
  windows: {
    onFocusChanged: {
      addListener: vi.fn()
    },
    WINDOW_ID_NONE: -1
  }
};

// Mock location and dispatchEvent for JSDOM
// Instead of replacing the entire window object, we modify the existing global.window
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'location', {
    value: {
      href: 'https://chatgpt.com/c/123',
      origin: 'https://chatgpt.com'
    },
    writable: true,
    configurable: true
  });
}

// Mock ResizeObserver (required by ReactFlow and some AntD components)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
