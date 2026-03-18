import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { injectFetchHook } from "./content";

describe("Test Content Script", () => {
    let appendSpy;
    let onMessageListener;

    beforeAll(() => {
        // Capture the listener registered when content.js was imported
        // This only happens once, so we must do it before clearAllMocks hits it
        onMessageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
    });

    beforeEach(() => {
        vi.clearAllMocks();
        appendSpy = vi.spyOn(document.head || document.documentElement, "appendChild");
    });

    it("injects fetch hook", () => {
        vi.spyOn(document, "createElement");
        injectFetchHook();
        expect(document.createElement).toHaveBeenCalledWith("script");
        expect(appendSpy).toHaveBeenCalled();
        expect(chrome.runtime.getURL).toHaveBeenCalledWith("src/fetch.js");
        expect(appendSpy.mock.calls[0][0].src).toBe("chrome-extension://mock-id/src/fetch.js");
    });

    it("handles CHATGPT_CONVERSATION message and sends data", () => {
        const payload = { message: "hello" };

        const event = new MessageEvent("message", {
            data: { type: "CHATGPT_CONVERSATION", payload: payload },
            origin: "https://chatgpt.com",
            source: window
        });

        window.dispatchEvent(event);

        // ASSERT
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
            type: "CHAT_DATA",
            messages: payload,
            url: window.location.href
        });
    });

    it("ignores messages from invalid origin", () => {
        const event = new MessageEvent("message", {
            data: { type: "CHATGPT_CONVERSATION", payload: { message: "hi" } },
            origin: "https://evil.com",
            source: window
        });

        window.dispatchEvent(event);

        expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    });

    it("handles PAGE_CHANGED message and sends data", () => {
        // Step 1: Set up conversation data in content.js by sending a message
        const payload = { message: "cached hello" };
        const event = new MessageEvent("message", {
            data: { type: "CHATGPT_CONVERSATION", payload: payload },
            origin: "https://chatgpt.com",
            source: window
        });
        window.dispatchEvent(event);

        // Assert it sent the initial data
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
            type: "CHAT_DATA",
            messages: payload,
            url: window.location.href
        });

        vi.clearAllMocks(); // Clear mocks for the next check

        // Step 2: Trigger the listener (which we captured in beforeAll)
        onMessageListener({ type: "PAGE_CHANGED" }, {}, vi.fn());

        // Step 3: ASSERT that it sends both PAGE_CHANGED and the current data
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
            type: "PAGE_CHANGED",
            url: window.location.href
        });

        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
            type: "CHAT_DATA",
            messages: payload,
            url: window.location.href
        });
    });
}); 