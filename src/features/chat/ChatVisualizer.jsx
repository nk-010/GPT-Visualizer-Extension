
import { useState, useEffect, useCallback, useRef } from 'react';
import { Typography, Empty, Tag, Space } from 'antd';
import { UserOutlined, RobotOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { ReactFlow, Background, Controls, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

import ChatMessageNode from './ChatMessageNode';
import './ChatVisualizer.css';

const nodeTypes = {
    chatMessage: ChatMessageNode,
};


const ChatVisualizer = () => {
    const [messages, setMessages] = useState([]);
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const messageRef = useRef(null);

    /* To handle the messages from the content script */
    useEffect(() => {
        // Listen for messages from content script
        const handleMessage = (request, sender, sendResponse) => {
            if (request.type === 'CHAT_DATA') {
                console.log('Received chat data:', request?.messages);
                setMessages(request?.messages);
                setIsLoading(false);
            } else if (request.type === 'PAGE_CHANGED') {
                console.log('Page navigated to:', request?.url);
                // Only clear if it's a new conversation path
                const url = request?.url;
                const regex = /\/c\/|\/g\//; // Matches either "/c/" OR "/g/"

                if (url && regex.test(url)) {
                    setMessages([]);
                    setSelectedMessage(null);
                    setIsLoading(true);
                } else {
                    setMessages([]);
                    setSelectedMessage(null);
                    setIsLoading(false);
                }
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage); //adding the message listener

        return () => chrome.runtime.onMessage.removeListener(handleMessage); //removing the message listener when the component unmounts
    }, []);


    /* To build the tree structure from the messages */
    useEffect(() => {

        if (!messages || Object.keys(messages).length === 0) return;

        const nodes = [];
        const edges = [];

        const horizontalSpacing = 300;
        const verticalSpacing = 150;


        function getSubtreeWidth(nodeId) {
            /* function to get the width of the subtree */

            const node = messages[nodeId];
            if (!node) return 1; // leaf node counts as 1 unit

            const children = node.children || [];

            // recursively sum widths of children
            if (children.length === 0) return 1;

            return children.reduce((sum, childId) => sum + getSubtreeWidth(childId), 0);
        }

        function buildTree(nodeId, depth = 0, startX = 0, parentVisibleId = null) {
            /* function to build the tree structure */

            const node = messages[nodeId];
            if (!node) return;

            const role = node?.message?.author?.role || "system";
            const content = node?.message?.content?.parts?.[0] || "";
            const preview = content?.slice(0, 80) + (content?.length > 80 ? "..." : "");
            const children = node.children || [];
            const createTime = node?.message?.create_time || "";

            let shouldRenderSystem = false;

            if (role === "system") shouldRenderSystem = children.length > 2;
            else if (role === "assistant") shouldRenderSystem = content?.length > 0;
            else if (role === "user") shouldRenderSystem = true;

            let currentVisibleId = parentVisibleId;

            if (shouldRenderSystem) {


                nodes.push({
                    id: node.id,
                    type: 'chatMessage',
                    data: {
                        label: preview || "",
                        role: role,
                        fullContent: content,
                        queryTime: createTime
                    },
                    position: {
                        x: startX,
                        y: depth * verticalSpacing
                    }
                });

                if (parentVisibleId) {
                    edges.push({
                        id: `${parentVisibleId}-${node.id}`,
                        source: parentVisibleId,
                        target: node.id
                    });
                }

                currentVisibleId = node.id;
                depth += 1;
            }

            // Compute dynamic x positions for children
            let childX = startX;
            children.forEach((childId) => {
                const subtreeWidth = getSubtreeWidth(childId) * horizontalSpacing;
                buildTree(childId, depth, childX, currentVisibleId);
                childX += subtreeWidth;
            });
        }

        /* To find the root of the tree */
        const allMessages = Object.values(messages);
        const root = allMessages.find(
            m => !allMessages.some(msg => msg.id === m.parent)
        );

        if (root) {
            buildTree(root.id);
        }
        else {
            console.log("No root found");
        }

        setNodes(nodes);
        setEdges(edges);

    }, [messages]);


    const onNodesChange = useCallback(
        (changes) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
        [],
    );
    const onEdgesChange = useCallback(
        (changes) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
        [],
    );

    /* To handle the node click event */
    const onNodeClick = useCallback((event, node) => {

        const readableTime = new Date(node.data.queryTime * 1000).toLocaleString();
        if (node.data && node.data.fullContent) {
            setSelectedMessage({
                role: node.data.role,
                content: node.data.fullContent,
                queryTime: readableTime
            });
        }

        setTimeout(() => {
            messageRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 0);

    }, []);



    if (isLoading) {
        return (
            <div className="empty-state">
                <Typography.Text type="secondary">Updating graph for new page...</Typography.Text>
            </div>
        );
    }

    if (messages?.length === 0) {
        return (
            <div className="empty-state">
                <Empty description="No chat data detected. Open a ChatGPT conversation to start." />
                <button
                    onClick={() => {
                        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                            chrome.tabs.reload(tabs[0].id);
                        });
                    }}
                    className="manual-refresh-btn"
                >
                    Manual Refresh
                </button>
            </div>
        );
    }

    return (
        <div className="chat-visualizer-container">
            {/* <div className="chat-header">
                <Typography.Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                    Chat Flow Visualizer
                </Typography.Title>
                <Space>
                    <button onClick={refreshData} className="refresh-button">
                        Fetch Chat
                    </button>
                </Space>
            </div> */}


            <div style={{ height: '550px', width: '100%', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    // onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    nodeTypes={nodeTypes}
                    fitView
                    colorMode="light"
                >
                    <Background />
                    <Controls />
                </ReactFlow>
            </div>

            {selectedMessage && (
                <div className="message-details-container">
                    <div className="details-header">
                        <Space>
                            {selectedMessage.role === 'user' ? (
                                <Tag color="blue" icon={<UserOutlined />}>User Message</Tag>
                            ) : (
                                <Tag color="green" icon={<RobotOutlined />}>Assistant Response</Tag>
                            )}
                        </Space>

                        <Space>
                            {selectedMessage.role === 'user' ? (
                                <Tag color="blue" icon={<ClockCircleOutlined />}>Query Time: {selectedMessage.queryTime}</Tag>
                            ) : (
                                <Tag color="green" icon={<ClockCircleOutlined />}>Response Time: {selectedMessage.queryTime}</Tag>
                            )}
                        </Space>

                        <button
                            onClick={() => setSelectedMessage(null)}
                            style={{
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                color: '#9ca3af'
                            }}
                        >
                            Close
                        </button>
                    </div>
                    <div ref={messageRef} className="details-content">
                        {selectedMessage.content}
                    </div>
                </div>
            )}

        </div>
    );
};

export default ChatVisualizer;
