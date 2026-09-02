
/* Getting the information through script injection */

// Inject fetch interceptor
export function injectFetchHook() {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("src/scripts/fetch.js");
    script.type = "text/javascript";

    (document.head || document.documentElement).appendChild(script);

    script.onload = () => {
        script.remove();
    };
}

injectFetchHook();

let conversationTitle = null;
let conversationData = null;

function mergeConversationMessages(existingMessages, incomingMessages) {
    const nextMessages = { ...(existingMessages || {}) };

    if (!incomingMessages || typeof incomingMessages !== 'object') {
        return nextMessages;
    }

    Object.entries(incomingMessages).forEach(([messageKey, incomingMessage]) => {
        if (!incomingMessage) return;

        if (typeof incomingMessage !== 'object' || Array.isArray(incomingMessage)) {
            nextMessages[messageKey] = incomingMessage;
            return;
        }

        const message = {
            ...incomingMessage,
            id: incomingMessage.id || messageKey,
        };

        const existingMessage = nextMessages[message.id];
        const mergedMessage = {
            ...(existingMessage || {}),
            ...message,
            message: {
                ...(existingMessage?.message || {}),
                ...(message.message || {}),
                author: {
                    ...((existingMessage?.message?.author) || {}),
                    ...((message.message && message.message.author) || {}),
                },
                content: {
                    ...((existingMessage?.message?.content) || {}),
                    ...((message.message && message.message.content) || {}),
                },
            },
            children: Array.from(new Set([
                ...(existingMessage?.children || []),
                ...(message.children || []),
            ])),
            versionIds: Array.from(new Set([
                ...(existingMessage?.versionIds || []),
                ...(message.versionIds || []),
            ])),
        };

        nextMessages[message.id] = mergedMessage;

        if (message.parentId && message.parentId !== null && !nextMessages[message.parentId]) {
            nextMessages[message.parentId] = {
                id: message.parentId,
                children: [message.id],
                message: { author: { role: 'system' }, content: { parts: [''] } },
            };
        }

        if (message.parentId && nextMessages[message.parentId]) {
            const parentChildren = new Set(nextMessages[message.parentId].children || []);
            parentChildren.add(message.id);
            nextMessages[message.parentId] = {
                ...nextMessages[message.parentId],
                children: Array.from(parentChildren),
            };
        }
    });

    return nextMessages;
}

// Listen for messages from fetch.js (window listener because message is sent from a script)
window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    if (
        event.origin !== "https://chatgpt.com" &&
        event.origin !== "https://chat.openai.com"
    ) {
        return;
    }

    if (event.data?.type === "CHATGPT_CONVERSATION") {
        const payload = event.data.payload;

        if (payload && Object.keys(payload).length > 0) {
            conversationData = mergeConversationMessages(conversationData, payload);
            conversationTitle = event.data.title || conversationTitle;

            chrome.runtime.sendMessage({
                type: "CHAT_DATA",
                messages: conversationData,
                title: conversationTitle,
                url: location.href
            });
        }
    }

    if (event.data?.type === "CHATGPT_VERSION_RESPONSE") {
        const payload = event.data.payload;

        if (payload && Object.keys(payload).length > 0) {
            conversationData = mergeConversationMessages(conversationData, payload);

            chrome.runtime.sendMessage({
                type: "CHAT_DATA",
                messages: conversationData,
                title: conversationTitle,
                url: location.href
            });
        }
    }
});


/* Listen for messages from background.js */
chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
    if (request.type === "PAGE_CHANGED" || request.type === "SIDE_PANEL_OPENED") {

        if (request.type === "PAGE_CHANGED") {
            chrome.runtime.sendMessage({
                type: "PAGE_CHANGED",
                url: location.href
            });
            // Ensure fetch hook is injected (guard in fetch.js handles redundancy)
            injectFetchHook();
        }

        // sending the current data to the UI to display
        chrome.runtime.sendMessage({
            type: "CHAT_DATA",
            messages: conversationData,
            title: conversationTitle,
            url: location.href
        });
    }
});

