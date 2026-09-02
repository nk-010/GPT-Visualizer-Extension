
/**
 * Since fetch.js is an Immediately Invoked Function Expression (IIFE) that 
 * modifies the global `window.fetch`, we test it by mocking the environment.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Fetch Interceptor', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      __gpt_visualizer_injected: false,
      __gpt_visualizer: undefined,
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
  });

  it('should intercept the correct conversation URL and post a message', async () => {
    await import('./fetch.js?test=' + Date.now());

    const testUrl = 'https://chatgpt.com/backend-api/conversation/123';
    await window.fetch(testUrl);

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(window.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'CHATGPT_CONVERSATION',
        payload: expect.any(Object)
      }),
      'https://chatgpt.com'
    );
  });

  it('should normalize legacy mapping payloads into a message map', async () => {
    await import('./fetch.js?test=' + (Date.now() + 1));

    const legacyPayload = {
      conversation_id: 'legacy-1',
      title: 'Legacy thread',
      mapping: {
        root: {
          id: 'root',
          parent: null,
          children: ['m1'],
          message: { author: { role: 'user' }, content: { parts: ['hello'] } }
        },
        m1: {
          id: 'm1',
          parent: 'root',
          children: [],
          message: { author: { role: 'assistant' }, content: { parts: ['hi'] } }
        }
      }
    };

    const normalized = window.__gpt_visualizer.normalizeConversationPayload(legacyPayload, 'https://chatgpt.com/backend-api/conversation/legacy-1');

    expect(normalized.messages.root).toMatchObject({ id: 'root', hasVersions: false });
    expect(normalized.messages.m1).toMatchObject({ id: 'm1', parentId: 'root', hasVersions: false });
  });

  it('should normalize the new items/messages format and detect versioned messages', async () => {
    await import('./fetch.js?test=' + (Date.now() + 2));

    const payload = {
      conversation_id: 'new-1',
      title: 'Versioned thread',
      items: [
        {
          id: 'msg-1',
          parent: null,
          role: 'user',
          content: { parts: ['hello'] },
          has_versions: false,
          children: ['msg-2']
        },
        {
          id: 'msg-2',
          parent: 'msg-1',
          role: 'assistant',
          content: { parts: ['answer'] },
          has_versions: true,
          version_count: 2,
          versions: ['version-a', 'version-b'],
          children: []
        }
      ]
    };

    const normalized = window.__gpt_visualizer.normalizeConversationPayload(payload, 'https://chatgpt.com/backend-api/conversations/new-1');

    expect(normalized.messages['msg-1']).toMatchObject({ id: 'msg-1', hasVersions: false });
    expect(normalized.messages['msg-2']).toMatchObject({ id: 'msg-2', hasVersions: true, versionIds: ['version-a', 'version-b'] });
  });

  it('should preserve conversation order when parent IDs are missing in the new messages array', async () => {
    await import('./fetch.js?test=' + (Date.now() + 3));

    const payload = {
      conversation_id: 'ordered-1',
      messages: [
        { id: 'user-1', role: 'user', content: { parts: ['hello'] } },
        { id: 'assistant-1', role: 'assistant', content: { parts: ['hi'] } },
        { id: 'user-2', role: 'user', content: { parts: ['next'] } },
        { id: 'assistant-2', role: 'assistant', content: { parts: ['done'] } }
      ]
    };

    const normalized = window.__gpt_visualizer.normalizeConversationPayload(payload, 'https://chatgpt.com/backend-api/conversations/ordered-1');

    expect(normalized.messages['user-1'].children).toContain('assistant-1');
    expect(normalized.messages['assistant-1'].children).toContain('user-2');
    expect(normalized.messages['user-2'].children).toContain('assistant-2');
  });

  it('should keep version arrays as alternative branches instead of flattening them into sequential messages', async () => {
    await import('./fetch.js?test=' + (Date.now() + 4));

    const payload = [
      [
        { id: 'v-user-1', role: 'user', content: { parts: ['n'] } },
        { id: 'v-assistant-1', role: 'assistant', content: { parts: ['a1'] } }
      ],
      [
        { id: 'v-user-2', role: 'user', content: { parts: ['n'] } },
        { id: 'v-assistant-2', role: 'assistant', content: { parts: ['a2'] } }
      ]
    ];

    const normalized = window.__gpt_visualizer.normalizeVersionBranches(payload, 'conversation-id', 'message-id');

    expect(normalized.branchCount).toBe(2);
    expect(normalized.branches[0]).toHaveLength(2);
    expect(normalized.branches[1][1].id).toBe('v-assistant-2');
  });

  it('should merge the current message and all returned branches into one graph', async () => {
    await import('./fetch.js?test=' + (Date.now() + 6));

    const conversation = window.__gpt_visualizer.normalizeConversationPayload({
      conversation_id: 'merge-1',
      messages: [
        { id: 'previous', role: 'assistant', content: { parts: ['before'] } },
        {
          id: 'current',
          parent: 'previous',
          role: 'user',
          content: { parts: ['current'] },
          metadata: { has_versions: true }
        },
        { id: 'internal', parent: 'current', role: 'assistant', content: { parts: ['thinking'] } },
        { id: 'answer', parent: 'internal', role: 'assistant', content: { parts: ['answer'] } },
        { id: 'next', parent: 'answer', role: 'user', content: { parts: ['next'] } }
      ]
    });
    const branches = window.__gpt_visualizer.normalizeVersionBranches([
      [
        { id: 'alt-user-1', role: 'user', content: { parts: ['alternative 1'] } },
        { id: 'alt-internal-1', role: 'assistant', content: { parts: ['internal 1'] } },
        { id: 'alt-answer-1', role: 'assistant', content: { parts: ['answer 1'] } }
      ],
      [{ id: 'alt-user-2', role: 'user', content: { parts: ['alternative 2'] } }],
      [{ id: 'alt-user-3', role: 'user', content: { parts: ['alternative 3'] } }],
      [{ id: 'alt-user-4', role: 'user', content: { parts: ['alternative 4'] } }]
    ], 'merge-1', 'current');

    window.__gpt_visualizer.mergeVersionBranchesIntoConversation(conversation, 'current', branches.branches);
    window.__gpt_visualizer.mergeVersionBranchesIntoConversation(conversation, 'current', branches.branches);

    expect(conversation.messages.current).toBeDefined();
    expect(conversation.messages['current-current-version'].children).toEqual(['current']);
    expect(conversation.messages.previous.children).toEqual([
      'current-current-version',
      'current-version-0',
      'current-version-1',
      'current-version-2',
      'current-version-3'
    ]);
    expect(conversation.messages['current-version-0'].children).toEqual(['alt-user-1']);
    expect(conversation.messages['alt-user-1'].children).toContain('alt-internal-1');
    expect(conversation.messages.next).toBeDefined();
  });

  it('should prevent duplicate version requests for the same message', async () => {
    await import('./fetch.js?test=' + (Date.now() + 5));

    const key = 'new-1:msg-2';
    expect(window.__gpt_visualizer.versionRequestState.has(key)).toBe(false);

    window.__gpt_visualizer.trackVersionRequest(key);
    window.__gpt_visualizer.trackVersionRequest(key);

    expect(window.__gpt_visualizer.versionRequestState.get(key)).toBe('pending');
    expect(window.__gpt_visualizer.versionRequestState.size).toBe(1);
  });

  it('should NOT intercept non-conversation URLs', async () => {
    await import('./fetch.js?test=' + (Date.now() + 4));
    const otherUrl = 'https://chatgpt.com/other-api';

    await window.fetch(otherUrl);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(window.postMessage).not.toHaveBeenCalled();
  });
});
