import { Flex, Typography, Layout, theme } from 'antd';
import { OpenAIOutlined } from '@ant-design/icons';

import "./css/Nav.css"

const { Text } = Typography;
const { Header } = Layout;

const Nav = () => {
    const { token } = theme.useToken();

    return (
        <Header className="nav-header">
            <Flex align="center" gap={8} style={{ height: '100%' }}>
                <OpenAIOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
                <Text strong style={{ fontSize: 20 }}>ChatGPT Visualizer </Text>
            </Flex>
        </Header>
    )
}

export default Nav;
