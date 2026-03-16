/* Injecting fetch hook to intercept API calls */

(function () {
    if (window.__gpt_visualizer_injected) return;   //check to prevent injecting again
    window.__gpt_visualizer_injected = true;

    const originalFetch = window.fetch;

    //overriding the fetch method
    window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);
        const url = typeof args[0] === "string" ? args[0] : args[0].url;

        //intercepting the API call to the conversation endpoint
        if (url && url.includes("/backend-api/conversation/")) {
            const clone = response.clone(); //cloning the response to avoid modifying the original response
            clone.json().then(data => {
                if (data && "conversation_id" in data && data["mapping"]) {
                    window.postMessage({
                        type: "CHATGPT_CONVERSATION",
                        payload: data["mapping"],
                        url: window.location.href
                    }, window.location.origin);
                }
            }).catch(() => { });
        }

        return response;
    };

    console.log("[GPT Visualizer] Fetch interceptor active");
})();


