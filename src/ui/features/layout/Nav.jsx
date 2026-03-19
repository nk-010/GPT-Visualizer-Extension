import { Flex, Typography, Layout, theme, Tooltip } from 'antd';
import { useState, useEffect } from 'react';
import { OpenAIOutlined } from '@ant-design/icons';

import "./css/Nav.css"

const { Text } = Typography;
const { Header } = Layout;

const Nav = () => {
    const { token } = theme.useToken();
    const [chatTitle, setChatTitle] = useState("");

    useEffect(() => {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.type === "CHAT_DATA") {
                setChatTitle(request?.title);
            }
        });
    }, []);

    return (
        <Header className="nav-header">
            <Flex align="center" gap={8} style={{ height: '100%', width: '100%' }}>


                <Text
                    strong
                    ellipsis={{ tooltip: chatTitle || "ChatGPT Visualizer" }}
                    style={{ fontSize: 20 }}
                >
                    {chatTitle || "ChatGPT Visualizer"}
                </Text>

            </Flex>
        </Header>
    )
}

export default Nav;
