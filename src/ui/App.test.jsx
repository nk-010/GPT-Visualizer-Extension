
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

describe('App Component', () => {
  beforeEach(() => {
    // Mocking window.matchMedia because it's used for dark mode detection
    // and is not implemented in JSDOM by default.
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('renders the layout with the navigation header', () => {
    // --- ARRANGE ---
    render(<App />);

    // --- ACT ---
    // In this simple test, the "Act" is the rendering that happened in Arrange.
    // We are looking for the text rendered by the Nav component.
    const navText = screen.getByText(/ChatGPT Visualizer/i);

    // --- ASSERT ---
    expect(navText).toBeInTheDocument();
  });
});
