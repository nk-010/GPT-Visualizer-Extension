
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

        // Only update and send if we have actual data
        if (payload && Object.keys(payload).length > 0) {
            conversationData = payload;
            conversationTitle = event.data.title;

            // sending the data to the UI to display
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
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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

