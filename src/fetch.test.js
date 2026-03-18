
/**
 * Since fetch.js is an Immediately Invoked Function Expression (IIFE) that 
 * modifies the global `window.fetch`, we test it by mocking the environment.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Fetch Interceptor', () => {
  beforeEach(() => {
    // Reset the window object and state before each test
    vi.stubGlobal('window', {
      __gpt_visualizer_injected: false,
      location: {
        href: 'https://chatgpt.com/c/123',
        origin: 'https://chatgpt.com'
      },
      postMessage: vi.fn(),
      fetch: vi.fn().mockImplementation(() => Promise.resolve({
        clone: () => ({
          json: () => Promise.resolve({
            conversation_id: 'test-id',
            mapping: { message: 'hello' }
          })
        })
      }))
    });

    // We use a dynamic import to execute the IIFE in our mocked environment
    // In a real scenario, you might want to export the logic to make it easier to test
    // but for now, we'll simulate the injection.
  });

  it('should intercept the correct conversation URL and post a message', async () => {
    // --- ARRANGE ---
    // Import the fetch logic (this executes the IIFE)
    await import('./fetch.js?test=' + Date.now()); 

    const testUrl = 'https://chatgpt.com/backend-api/conversation/123';
    
    // --- ACT ---
    await window.fetch(testUrl);

    // --- ASSERT ---
    // Since fetch.js uses .then() internally, we wait a bit for the microtask queue
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(window.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'CHATGPT_CONVERSATION',
        payload: { message: 'hello' }
      }),
      'https://chatgpt.com'
    );
  });

  it('should NOT intercept non-conversation URLs', async () => {
    // --- ARRANGE ---
    await import('./fetch.js?test=' + (Date.now() + 1));
    const otherUrl = 'https://chatgpt.com/other-api';

    // --- ACT ---
    await window.fetch(otherUrl);

    // --- ASSERT ---
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(window.postMessage).not.toHaveBeenCalled();
  });
});
