import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

describe("Test Background Script", () => {
    let onInstalledListener;
    let onActivatedListener;
    let onFocusChangedListener;

    beforeAll(async () => {
        // Mock listeners before importing background.js to capture them
        chrome.runtime.onInstalled.addListener = vi.fn((cb) => {
            onInstalledListener = cb;
        });
        chrome.tabs.onActivated.addListener = vi.fn((cb) => {
            onActivatedListener = cb;
        });
        chrome.windows.onFocusChanged.addListener = vi.fn((cb) => {
            onFocusChangedListener = cb;
        });

        // Dynamic import to trigger background.js side effects
        await import("./index.js");
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should inject content script on install", async () => {
        const fakeTabs = [
            { id: 1 },
            { id: 2 }
        ];

        chrome.tabs.query.mockResolvedValue(fakeTabs);

        if (onInstalledListener) {
            await onInstalledListener();
        } else {
            throw new Error("onInstalledListener was not registered");
        }

        expect(chrome.scripting.executeScript).toHaveBeenCalledTimes(2);
        expect(chrome.scripting.executeScript).toHaveBeenCalledWith(
            expect.objectContaining({ target: { tabId: 1 } })
        );
    });

    it("should identify tab changes and send messages", async () => {
        const mockTab = { id: 1, url: "https://chatgpt.com/" };

        // Test tab activation
        if (!onActivatedListener) throw new Error("onActivatedListener was not registered");
        
        chrome.tabs.get.mockResolvedValue(mockTab);
        await onActivatedListener({ tabId: 1 });

        expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
            type: "PAGE_CHANGED",
            url: "https://chatgpt.com/"
        });

        vi.clearAllMocks();

        // Test window focus
        if (!onFocusChangedListener) throw new Error("onFocusChangedListener was not registered");

        chrome.tabs.query.mockResolvedValue([mockTab]);
        await onFocusChangedListener(1);

        expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
            type: "PAGE_CHANGED",
            url: "https://chatgpt.com/"
        });
    });
});