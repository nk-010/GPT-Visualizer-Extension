/* Injecting fetch hook to intercept API calls */

(function () {
    const originalFetch = window.fetch;


    const state = {
        versionRequestState: new Map(),
        pendingVersionRequests: new Map(),
        authenticatedRequest: null,
        conversations: new Map(),
    };

    function rememberAuthenticatedRequest(request) {
        if (!(request instanceof Request)) {
            return;
        }

        if (!request.url || !isConversationRequest(request.url)) {
            return;
        }

        state.authenticatedRequest = request;
        drainWaitingVersionRequests();
    }

    function isConversationRequest(url) {
        if (!url) return false;
        return (
            url.includes('/backend-api/conversation/') ||
            url.includes('/backend-api/conversations/') ||
            url.includes('conversation_id=')
        );
    }

    function isVersionRequest(url) {
        if (!url) return false;
        const normalized = url.toLowerCase();
        return (
            normalized.includes('/versions') ||
            normalized.includes('version_count=') ||
            normalized.includes('has_versions=true') ||
            normalized.includes('message_id=')
        );
    }

    function readMessageAuthorRole(message) {
        if (!message) return 'system';

        if (message.author && typeof message.author === 'object') {
            if (message.author.role) return message.author.role;
        }

        return message.role || 'system';
    }

    function readMessageContent(message) {
        if (!message) return '';

        if (typeof message.content === 'string') return message.content;

        if (message.content && typeof message.content === 'object') {
            if (Array.isArray(message.content.parts) && message.content.parts.length > 0) {
                return message.content.parts.join(' ');
            }
            if (message.content.text) return message.content.text;
            if (message.content.content) return message.content.content;
        }

        return '';
    }

    function isInternalMessage(rawEntry) {
        const metadata = rawEntry?.metadata || {};
        const content = rawEntry?.content || rawEntry?.message?.content || {};
        const contentType = metadata.content_type || content.content_type || metadata.type || content.type;
        return contentType === 'model_editable_context' || rawEntry?.role === 'system';
    }

    function normalizeMessageNode(rawEntry, fallbackId, conversationId, parentId = null) {
        const rawMessage = rawEntry && rawEntry.message ? rawEntry.message : rawEntry;
        const metadata = rawEntry?.metadata || rawMessage?.metadata || {};
        const entryId = String(rawEntry?.id || rawEntry?.message_id || fallbackId || 'unknown');
        const children = Array.isArray(rawEntry?.children)
            ? rawEntry.children.filter(Boolean)
            : Array.isArray(rawEntry?.child_ids)
                ? rawEntry.child_ids.filter(Boolean)
                : [];

        const versionIds = Array.isArray(rawEntry?.versions)
            ? rawEntry.versions
                .map((version) => version?.id || version?.message_id || version)
                .filter(Boolean)
            : Array.isArray(rawEntry?.version_ids)
                ? rawEntry.version_ids.filter(Boolean)
                : [];

        const hasVersions = Boolean(
            metadata?.has_versions ||
            metadata?.hasVersions ||
            rawEntry?.has_versions ||
            rawEntry?.hasVersions ||
            rawEntry?.is_versioned ||
            rawEntry?.version_count ||
            rawEntry?.versionCount ||
            versionIds.length > 0
        );

        return {
            id: entryId,
            conversationId,
            parent: rawEntry?.parent || parentId,
            parentId: rawEntry?.parent || parentId,
            children,
            message: {
                id: entryId,
                author: {
                    role: readMessageAuthorRole(rawMessage),
                },
                role: readMessageAuthorRole(rawMessage),
                content: {
                    parts: [readMessageContent(rawMessage)],
                },
                create_time: rawMessage?.create_time || rawEntry?.create_time || rawEntry?.timestamp || 0,
            },
            hasVersions,
            versionIds,
            version_count: rawEntry?.version_count || rawEntry?.versionCount || versionIds.length || 0,
            metadata,
        };
    }

    function normalizeLegacyConversation(data, url) {
        const conversationId = data.conversation_id || data.conversationId || data.id || url?.split('/').filter(Boolean).pop() || 'unknown';
        const messages = {};
        const mapping = data.mapping || {};

        Object.entries(mapping).forEach(([key, value]) => {
            const normalizedEntry = normalizeMessageNode(value, key, conversationId, value?.parent || null);
            messages[normalizedEntry.id] = normalizedEntry;
        });

        Object.values(messages).forEach((message) => {
            if (message.parent && messages[message.parent]) {
                if (!messages[message.parent].children.includes(message.id)) {
                    messages[message.parent].children.push(message.id);
                }
            }
        });

        return {
            conversationId,
            title: data.title || null,
            messages,
        };
    }

    function normalizeModernConversation(data, url) {
        const conversationId = data.conversation_id || data.conversationId || data.id || url?.split('/').filter(Boolean).pop() || 'unknown';
        const messages = {};
        const rawItems = Array.isArray(data.items)
            ? data.items
            : Array.isArray(data.messages)
                ? data.messages
                : [];

        let previousVisibleId = null;

        rawItems.forEach((item, index) => {
            const candidateId = String(item?.id || item?.message_id || `generated-${index}`);
            const normalizedEntry = normalizeMessageNode(item, candidateId, conversationId, item?.parent || null);
            normalizedEntry.isInternal = isInternalMessage(item);
            normalizedEntry.sequenceIndex = index;

            if (item?.parent && messages[item.parent]) {
                normalizedEntry.parent = item.parent;
                normalizedEntry.parentId = item.parent;
            }

            if (!normalizedEntry.parentId && !normalizedEntry.isInternal && previousVisibleId) {
                normalizedEntry.parent = previousVisibleId;
                normalizedEntry.parentId = previousVisibleId;
            }

            messages[normalizedEntry.id] = normalizedEntry;

            if (normalizedEntry.parentId && messages[normalizedEntry.parentId]) {
                const parentMessage = messages[normalizedEntry.parentId];
                if (!parentMessage.children.includes(normalizedEntry.id)) {
                    parentMessage.children.push(normalizedEntry.id);
                }
            }

            if (!normalizedEntry.isInternal) {
                previousVisibleId = normalizedEntry.id;
            }
        });

        return {
            conversationId,
            title: data.title || null,
            messages,
        };
    }

    function normalizeVersionBranches(versionPayload, conversationId, messageId) {
        if (!Array.isArray(versionPayload)) {
            return { conversationId, messageId, branchCount: 0, branches: [] };
        }

        const branches = versionPayload
            .map((branch, branchIndex) => {
                if (!Array.isArray(branch)) {
                    return [];
                }

                return branch.map((entry, entryIndex) => {
                    const candidateId = String(entry?.id || entry?.message_id || `${messageId}-version-${branchIndex}-${entryIndex}`);
                    return normalizeMessageNode(entry, candidateId, conversationId, messageId);
                });
            })
            .filter((branch) => branch.length > 0);

        return {
            conversationId,
            messageId,
            branchCount: branches.length,
            branches,
        };
    }

    function mergeVersionBranchesIntoConversation(normalizedConversation, messageId, versionBranches) {
        if (!normalizedConversation?.messages || !messageId || !Array.isArray(versionBranches)) {
            return normalizedConversation;
        }

        const messages = normalizedConversation.messages;
        const currentMessage = messages[messageId];
        if (!currentMessage) return normalizedConversation;

        const conversationId = normalizedConversation.conversationId;
        const currentRootId = `${messageId}-current-version`;
        const previousId = currentMessage.versionAnchorParentId ?? currentMessage.parentId ?? currentMessage.parent ?? null;
        const previousMessage = previousId ? messages[previousId] : null;

        if (previousMessage) {
            previousMessage.children = (previousMessage.children || []).filter((childId) => childId !== messageId);
            if (!previousMessage.children.includes(currentRootId)) {
                previousMessage.children.push(currentRootId);
            }
        }

        if (!messages[currentRootId]) {
            messages[currentRootId] = {
                id: currentRootId,
                conversationId,
                parent: previousId,
                parentId: previousId,
                children: [messageId],
                message: {
                    id: currentRootId,
                    author: { role: 'system' },
                    role: 'system',
                    content: { parts: ['Current version'] },
                },
                isVersionBranch: true,
                isCurrentVersion: true,
                branchIndex: -1,
                metadata: { isVersionBranch: true, isCurrentVersion: true },
            };
        }

        currentMessage.versionAnchorParentId = previousId;
        currentMessage.parent = currentRootId;
        currentMessage.parentId = currentRootId;

        versionBranches.forEach((branch, branchIndex) => {
            if (!Array.isArray(branch) || branch.length === 0) return;

            const rootVersionId = `${messageId}-version-${branchIndex}`;
            const branchRoot = messages[rootVersionId] || {
                id: rootVersionId,
                conversationId,
                parent: previousId,
                parentId: previousId,
                children: [],
                message: {
                    id: rootVersionId,
                    author: { role: 'system' },
                    role: 'system',
                    content: { parts: [`Version ${branchIndex + 1}`] },
                },
                isVersionBranch: true,
                branchIndex,
                hasVersions: true,
                metadata: { isVersionBranch: true },
            };

            branchRoot.children = [];
            let parentId = rootVersionId;
            const branchIds = new Set(branch.map((entry) => entry?.id).filter(Boolean));

            branch.forEach((entry) => {
                if (!entry?.id) return;

                const explicitParentId = entry.parentId || entry.parent;
                if (explicitParentId && branchIds.has(explicitParentId)) {
                    parentId = explicitParentId;
                }

                const existingEntry = messages[entry.id];
                const mergedEntry = {
                    ...(existingEntry || {}),
                    ...entry,
                    children: Array.from(new Set([
                        ...(existingEntry?.children || []),
                        ...(entry.children || []),
                    ])),
                    parent: parentId,
                    parentId,
                    isVersion: true,
                    versionBranchIndex: branchIndex,
                };

                messages[entry.id] = mergedEntry;
                if (!branchRoot.children.includes(entry.id) && parentId === rootVersionId) {
                    branchRoot.children.push(entry.id);
                }

                if (parentId !== rootVersionId && messages[parentId]) {
                    messages[parentId].children = Array.from(new Set([
                        ...(messages[parentId].children || []),
                        entry.id,
                    ]));
                }

                parentId = entry.id;
            });

            messages[rootVersionId] = branchRoot;
            if (previousMessage && !previousMessage.children.includes(rootVersionId)) {
                previousMessage.children.push(rootVersionId);
            }
        });

        return normalizedConversation;
    }

    function normalizeConversationPayload(data, url) {
        if (!data) {
            return { conversationId: null, title: null, messages: {} };
        }

        if (data.mapping) {
            return normalizeLegacyConversation(data, url);
        }

        if (Array.isArray(data.items) || Array.isArray(data.messages)) {
            return normalizeModernConversation(data, url);
        }

        return normalizeModernConversation({ ...data, items: data.items || data.messages || [] }, url);
    }

    function getAuthenticatedRequestTemplate() {
        if (state.authenticatedRequest instanceof Request) {
            return state.authenticatedRequest;
        }

        return null;
    }

    function drainWaitingVersionRequests() {
        if (!state.authenticatedRequest || state.pendingVersionRequests.size === 0) {
            return;
        }

        const queuedEntries = Array.from(state.pendingVersionRequests.entries());
        queuedEntries.forEach(([requestKey, pendingRequest]) => {
            if (state.versionRequestState.get(requestKey) !== 'waiting') {
                return;
            }

            state.pendingVersionRequests.delete(requestKey);
            queueVersionRequestForMessage(pendingRequest.conversationId, pendingRequest.messageId, pendingRequest.message, pendingRequest.messages);
        });
    }

    function queueVersionRequestForMessage(conversationId, messageId, message, messages = {}) {
        const requestKey = `${conversationId}:${messageId}`;
        const authenticatedRequest = getAuthenticatedRequestTemplate();

        if (!authenticatedRequest) {
            state.versionRequestState.set(requestKey, 'waiting');
            state.pendingVersionRequests.set(requestKey, { conversationId, messageId, message, messages });
            return;
        }

        const currentStatus = state.versionRequestState.get(requestKey);
        if (currentStatus === 'loaded' || currentStatus === 'pending') {
            return;
        }

        if (!trackVersionRequest(requestKey)) {
            return;
        }

        const versionUrl = buildVersionRequestUrl(conversationId, messageId);
        if (!versionUrl) {
            state.versionRequestState.set(requestKey, 'failed');
            return;
        }

        const versionRequest = new Request(versionUrl, authenticatedRequest);

        originalFetch(versionRequest)
            .then((response) => {
                if (!response || !response.ok) {
                    state.versionRequestState.set(requestKey, 'failed');
                    return null;
                }

                if (response && typeof response.clone === 'function') {
                    return response.clone().json();
                }
                return null;
            })
            .then((versionData) => {
                if (!versionData) {
                    state.versionRequestState.set(requestKey, 'failed');
                    return;
                }

                const versionResult = normalizeVersionBranches(versionData, conversationId, messageId);
                if (versionResult && versionResult.branches.length > 0 && messages && messages[messageId]) {
                    const normalizedConversation = {
                        conversationId,
                        messages,
                    };
                    mergeVersionBranchesIntoConversation(normalizedConversation, messageId, versionResult.branches);
                    state.conversations.set(conversationId, normalizedConversation);

                    window.postMessage({
                        type: 'CHATGPT_VERSION_RESPONSE',
                        conversationId,
                        messageId,
                        payload: normalizedConversation.messages,
                        branches: versionResult.branches,
                        url: window.location.href,
                    }, window.location.origin);
                }

                state.versionRequestState.set(requestKey, 'loaded');
                state.pendingVersionRequests.delete(requestKey);
            })
            .catch((error) => {
                console.warn('ChatGPT version request failed', { conversationId, messageId, error });
                state.versionRequestState.set(requestKey, 'failed');
                state.pendingVersionRequests.delete(requestKey);
            });
    }

    function queueVersionRequestsForConversation(normalizedConversation) {
        if (!normalizedConversation || !normalizedConversation.messages) return;

        const { conversationId, messages } = normalizedConversation;

        Object.values(messages).forEach((message) => {
            const messageId = String(message?.id || '');
            if (!messageId) return;

            const hasVersions = Boolean(
                message?.metadata?.has_versions ||
                message?.metadata?.hasVersions ||
                message.hasVersions ||
                message.version_count ||
                (Array.isArray(message.versionIds) && message.versionIds.length > 0)
            );

            if (!hasVersions) return;

            queueVersionRequestForMessage(conversationId, messageId, message, messages);
        });
    }

    function buildVersionRequestUrl(conversationId, messageId) {
        if (!conversationId || !messageId) return null;

        const base = window.location.origin || 'https://chatgpt.com';
        return `${base}/backend-api/conversations/${encodeURIComponent(conversationId)}/versions?message_id=${encodeURIComponent(messageId)}`;
    }

    function extractConversationIdAndMessageIdFromVersionUrl(url) {
        if (!url) return { conversationId: null, messageId: null };

        try {
            const parsedUrl = new URL(url, window.location.origin);
            const messageId = parsedUrl.searchParams.get('message_id');
            const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
            const versionsIndex = pathParts.lastIndexOf('versions');
            const conversationId = versionsIndex > 0 ? pathParts[versionsIndex - 1] : null;

            return {
                conversationId: conversationId ? decodeURIComponent(conversationId) : null,
                messageId: messageId ? decodeURIComponent(messageId) : null,
            };
        } catch {
            return { conversationId: null, messageId: null };
        }
    }

    function trackVersionRequest(requestKey) {
        if (!requestKey) return false;
        const existingStatus = state.versionRequestState.get(requestKey);
        if (existingStatus === 'pending' || existingStatus === 'loaded') {
            return false;
        }

        state.versionRequestState.set(requestKey, 'pending');
        return true;
    }

    if (!window.__gpt_visualizer) {
        window.__gpt_visualizer = {
            normalizeConversationPayload,
            normalizeVersionBranches,
            mergeVersionBranchesIntoConversation,
            queueVersionRequestsForConversation,
            trackVersionRequest,
            versionRequestState: state.versionRequestState,
            buildVersionRequestUrl,
        };
    }

    if (!window.__gpt_visualizer.normalizeVersionBranches) {
        window.__gpt_visualizer.normalizeVersionBranches = normalizeVersionBranches;
    }

    window.__gpt_visualizer_injected = true;

    window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;

        if (url && isConversationRequest(url)) {
            if (args[0] instanceof Request) {
                rememberAuthenticatedRequest(args[0]);
            }

            const clone = response.clone();
            clone.json().then((data) => {
                if (!data || (!data.conversation_id && !data.mapping && !data.items && !data.messages)) {
                    return;
                }

                const normalizedConversation = normalizeConversationPayload(data, url);
                if (normalizedConversation && Object.keys(normalizedConversation.messages).length > 0) {
                    state.conversations.set(normalizedConversation.conversationId, normalizedConversation);
                    window.postMessage({
                        type: 'CHATGPT_CONVERSATION',
                        payload: normalizedConversation.messages,
                        title: normalizedConversation.title,
                        url: window.location.href,
                    }, window.location.origin);

                    queueVersionRequestsForConversation(normalizedConversation);
                }
            }).catch(() => {});
        }

        if (url && isVersionRequest(url)) {
            const { conversationId, messageId } = extractConversationIdAndMessageIdFromVersionUrl(url);
            if (!conversationId || !messageId) {
                return response;
            }

            const requestKey = `${conversationId}:${messageId}`;
            if (!trackVersionRequest(requestKey)) {
                return response;
            }

            const clone = response.clone();
            clone.json().then((data) => {
                if (!data || !Array.isArray(data)) {
                    state.versionRequestState.set(requestKey, 'failed');
                    return;
                }

                const versionResult = normalizeVersionBranches(data, conversationId, messageId);
                if (versionResult && versionResult.branches.length > 0) {
                    const normalizedConversation = state.conversations.get(conversationId);
                    if (normalizedConversation) {
                        mergeVersionBranchesIntoConversation(normalizedConversation, messageId, versionResult.branches);
                    }

                    window.postMessage({
                        type: 'CHATGPT_VERSION_RESPONSE',
                        conversationId,
                        messageId,
                        payload: normalizedConversation?.messages,
                        branches: versionResult.branches,
                        url: window.location.href,
                    }, window.location.origin);
                    state.versionRequestState.set(requestKey, 'loaded');
                    return;
                }

                state.versionRequestState.set(requestKey, 'failed');
            }).catch((error) => {
                console.warn('ChatGPT version payload parse failed', { conversationId, messageId, error });
                state.versionRequestState.set(requestKey, 'failed');
            });
        }

        return response;
    };
})();

// (function () {
//     const originalFetch = window.fetch;

//     window.fetch = async function (...args) {
//         const input = args[0];
//         const init = args[1];

//         const url =
//             typeof input === 'string'
//                 ? input
//                 : input?.url;

//         // ==========================================
//         // TEST CODE GOES HERE
//         // ==========================================

//         if (url?.includes('/versions') && input instanceof Request) {

//             console.log('===== VERSION REQUEST TEST =====');

//             const originalRequest = input;

//             // TEST 1
//             // try {
//             //     const clonedRequest = originalRequest.clone();

//             //     const cloneResponse =
//             //         await originalFetch(clonedRequest);

//             //     console.log(
//             //         'TEST 1 - exact clone status:',
//             //         cloneResponse.status
//             //     );
//             // } catch (error) {
//             //     console.error('TEST 1 failed:', error);
//             // }

//             // // TEST 2
//             // try {
//             //     const testUrl = originalRequest.url;

//             //     const newRequest = new Request(
//             //         testUrl,
//             //         originalRequest
//             //     );

//             //     const newResponse =
//             //         await originalFetch(newRequest);

//             //     console.log(
//             //         'TEST 2 - new Request status:',
//             //         newResponse.status
//             //     );
//             // } catch (error) {
//             //     console.error('TEST 2 failed:', error);
//             // }


//             // TEST 3: Clone the authenticated Request but change message_id
//             try {
//                 const originalRequest = input;

//                 const testMessageId = '04bf63fb-b72a-43c1-ba55-a563edd94537';
// ;

//                 const testUrl = new URL(originalRequest.url);
//                 testUrl.searchParams.set('message_id', testMessageId);

//                 const newRequest = new Request(
//                     testUrl.toString(),
//                     originalRequest
//                 );

//                 const newResponse = await originalFetch(newRequest);

//                 console.log(
//                     'TEST 3 - changed message_id status:',
//                     newResponse.status
//                 );

//                 if (newResponse.ok) {
//                     const data = await newResponse.clone().json();

//                     console.log(
//                         'TEST 3 - response:',
//                         data
//                     );
//                 }
//             } catch (error) {
//                 console.error('TEST 3 failed:', error);
//             }
//         }
        

//         // if (
//         //     url?.includes('/backend-api/conversations/')
//         // ) {
//         //     console.log('API REQUEST');
//         //     console.log('URL:', url);
//         //     console.log('Is Request:', input instanceof Request);

//         //     if (input instanceof Request) {
//         //         console.log(
//         //             'Has authorization:',
//         //             input.headers.has('authorization')
//         //         );

//         //         console.log(
//         //             'Header names:',
//         //             [...input.headers.keys()]
//         //         );
//         //     }
//         // }


//         // Debug only the Message Versions request
//         if (url?.includes('/versions')) {
//             console.log('===== VERSION REQUEST =====');
//             console.log('URL:', url);
//             console.log('Input:', input);
//             console.log('Input is Request:', input instanceof Request);
//             console.log('Init:', init);

//             // If ChatGPT uses a Request object
//             if (input instanceof Request) {
//                 console.log(
//                     'Request headers:',
//                     [...input.headers.entries()].map(
//                         ([key, value]) =>
//                             key.toLowerCase() === 'authorization'
//                                 ? [key, '[REDACTED]']
//                                 : [key, value]
//                     )
//                 );
//             }

//             // If Authorization is in fetch options
//             if (init?.headers) {
//                 console.log(
//                     'Init headers:',
//                     init.headers
//                 );
//             }
//         }

//         const response = await originalFetch.apply(this, args);

//         return response;
//     };
// })();
