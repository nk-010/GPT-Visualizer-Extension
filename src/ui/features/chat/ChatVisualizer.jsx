
import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { Typography, Empty, Tag, Space, Button, theme } from 'antd';
import { UserOutlined, RobotOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { ReactFlow, Background, Controls, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

import ChatMessageNode from './ChatMessageNode';
import './ChatVisualizer.css';
import { ThemeContext } from '../../App';

const nodeTypes = {
    chatMessage: ChatMessageNode,
};

const { Text } = Typography;


const ChatVisualizer = () => {
    const { token } = theme.useToken();
    const { isDarkMode } = useContext(ThemeContext);
    const [messages, setMessages] = useState([]);
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const messageRef = useRef(null);


    const proOptions = { hideAttribution: true };

    /* To handle the messages from the content script */
    useEffect(() => {
        // Listen for messages from content script
        const handleMessage = (request, sender, sendResponse) => {
            if (request.type === 'CHAT_DATA') {
                // console.log('Received chat data:', request?.messages);
                setMessages(request?.messages);
                setIsLoading(false);
            } else if (request.type === 'PAGE_CHANGED') {
                // console.log('Page navigated to:', request?.url);
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
                <Button
                    type="primary"
                    onClick={() => {
                        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                            chrome.tabs.reload(tabs[0].id);
                        });
                    }}
                >
                    Manual Refresh
                </Button>
            </div>
        );
    }

    return (
        <div className="chat-visualizer-container">

            <div style={{
                height: '550px',
                width: '100%',
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: token.borderRadiusLG,
                overflow: 'hidden'
            }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    nodeTypes={nodeTypes}
                    fitView
                    colorMode={isDarkMode ? 'dark' : 'light'}
                    proOptions={proOptions}
                >
                    <Background />
                    <Controls />
                </ReactFlow>
            </div>

            {selectedMessage && (
                <div className="message-details-container" style={{
                    background: token.colorBgContainer,
                    borderColor: token.colorBorderSecondary
                }}>
                    <div className="details-header" style={{ borderColor: token.colorBorderSecondary }}>
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
                    <div ref={messageRef} className="details-content" style={{ color: token.colorText }}>
                        {selectedMessage.content}
                    </div>
                </div>
            )}

            <div style={{
                marginTop: '10px',
                padding: '10px',
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: token.borderRadiusLG,
                background: token.colorBgContainer
            }}>
                <Text type="secondary">Hint: If you face any issues, try closing and opening the extension again.</Text>
            </div>

        </div>
    );
};

export default ChatVisualizer;
