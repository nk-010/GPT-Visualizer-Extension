import contentScript from '../content/index.js?script';   //importing the content script (vite specific)

//setting the side panel behavior (open panel on action click)
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));


//injecting the content script (for the already open tabs when extension is installed)
chrome.runtime.onInstalled.addListener(async () => {
    const tabs = await chrome.tabs.query({
        url: [
            "https://chat.openai.com/*",
            "https://chatgpt.com/*"
        ]
    });

    for (const tab of tabs) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: [contentScript]
        });
    }
});



function identifyTabChange() {
    /*
    This function is used to identify the tab changes and 
    send a message to the content script to update the chat data.
    */

    // Listen for tab switches
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
        try {
            const tab = await chrome.tabs.get(activeInfo.tabId);

            try {
                await chrome.tabs.sendMessage(tab.id, { type: "PAGE_CHANGED", url: tab.url }); // chrome.tabs.sendMessage since message is sent to different world
            } catch (err) {
                console.warn("Content script not ready yet", err);
                // Optional: retry after short delay
                setTimeout(() => {
                    chrome.tabs.sendMessage(tab.id, { type: "PAGE_CHANGED", url: tab.url });
                }, 200);
            }
        } catch (err) {
            console.error("Failed to get tab info:", err);
        }
    });

    // Listen for window focus changes
    chrome.windows.onFocusChanged.addListener(async (windowId) => {
        if (windowId === chrome.windows.WINDOW_ID_NONE) return; // no focused window
        try {
            const [tab] = await chrome.tabs.query({ active: true, windowId });
            if (tab) {
                try {
                    await chrome.tabs.sendMessage(tab.id, { type: "PAGE_CHANGED", url: tab.url });
                } catch (err) {
                    console.warn("Content script not ready yet", err);
                    // Optional: retry after short delay
                    setTimeout(() => {
                        chrome.tabs.sendMessage(tab.id, { type: "PAGE_CHANGED", url: tab.url });
                    }, 200);
                }
            }
        } catch (err) {
            console.error("Failed to get active tab on window focus:", err);
        }
    });
}

// Call the function to start listening
identifyTabChange();