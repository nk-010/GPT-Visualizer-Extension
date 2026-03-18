
/* Getting the information through script injection */

// Inject fetch interceptor
export function injectFetchHook() {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("src/fetch.js");
    script.type = "text/javascript";

    (document.head || document.documentElement).appendChild(script);

    script.onload = () => {
        script.remove();
    };
}

injectFetchHook();

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

            // sending the data to the UI to display
            chrome.runtime.sendMessage({
                type: "CHAT_DATA",
                messages: conversationData,
                url: location.href
            });
        }
    }
});


/* Listen for page change messages from background.js */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "PAGE_CHANGED") {

        chrome.runtime.sendMessage({
            type: "PAGE_CHANGED",
            url: location.href
        });

        // Ensure fetch hook is injected (guard in fetch.js handles redundancy)
        injectFetchHook();

        // sending the current data to the UI to display
        chrome.runtime.sendMessage({
            type: "CHAT_DATA",
            messages: conversationData,
            url: location.href
        });
    }
});

