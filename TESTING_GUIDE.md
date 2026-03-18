# GPT Visualizer Testing Guide

Welcome to the testing guide! This document will serve as your quick-reference for everything related to testing this project.

## 1. The Testing Pyramid

Testing is usually organized into three layers:

1.  **Unit Tests (Base)**:
    *   **What**: Tests small, isolated pieces of code (like a single function).
    *   **Why**: They are extremely fast and help you find bugs in logic immediately.
    *   **Tool**: `Vitest`

2.  **Integration Tests (Middle)**:
    *   **What**: Tests how different parts of your app work together (like a React component rendered with its children).
    *   **Why**: Ensures that even if individual functions work, they still work when combined.
    *   **Tool**: `Vitest` + `React Testing Library (RTL)`

3.  **End-to-End (E2E) Tests (Top)**:
    *   **What**: Tests the entire app from the user's perspective (e.g., "User clicks button, expects to see graph").
    *   **Why**: Catches "big picture" issues that unit/integration tests might miss.
    *   **Tool**: `Playwright` (Optional future step)

## 2. Our Tools

*   **Vitest**: A modern testing framework built for Vite. It's incredibly fast because it shares the same configuration as your app's build process.
*   **React Testing Library (RTL)**: A library for testing React components. Instead of testing internal state (e.g., "is `state.loading` true?"), it encourages testing what the user sees (e.g., "is there a spinner on the screen?").

---

## 3. How to Run Tests

*   **`npm run test`**: Runs all tests in the terminal.
## 4. The AAA Pattern

Almost every test you write will follow this simple pattern:

1.  **Arrange**: Set up the conditions for the test (e.g., create variables, mock data).
2.  **Act**: Perform the action you want to test (e.g., call a function, click a button).
3.  **Assert**: Check the result to see if it matches your expectation.

**Example**:
```javascript
// Arrange
const a = 1;
const b = 2;

// Act
const result = sum(a, b);

## 5. Mocking (The "Trick" to Extension Testing)

Chrome extensions use APIs that don't exist in your terminal (like `chrome.runtime`). To test them, we use **mocks**—fake versions of these APIs that behave how we want.

*   **`vi.fn()`**: Creates a "Spy" function. You can check if it was called: `expect(mySpy).toHaveBeenCalled()`.
*   **`global.chrome`**: In `vitest.setup.js`, we defined a fake `chrome` object so your code doesn't crash when it tries to call it during a test.
*   **`ResizeObserver`**: Components like `ReactFlow` or Ant Design tables need to know the window size. JSDOM (the virtual browser for tests) doesn't support this, so we mock it as well.

## 6. Your Turn! (Next Steps)

1.  **Add a Test**: Try adding a test in `src/fetch.test.js` that checks if another URL (like one for settings) is ignored.
2.  **Break a Test**: Change the text in `Nav.jsx` and see `npm run test` fail. This helps you trust your tests!
3.  **Explore UI**: Run `npm run test:ui` and click around. It's a great way to see what's happening.
