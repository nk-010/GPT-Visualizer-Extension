
//setting the side panel behavior (open panel on action click)
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));


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

/*
   Listen for messages from the side panel (UI)
   and forward them to the content script.
*/
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
    if (message.type === 'SIDE_PANEL_OPENED') {
        // Forward the event to the active tab's content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { type: 'SIDE_PANEL_OPENED' });
            }
        });
    }
});