import { Typography, theme } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import { Handle, Position } from '@xyflow/react';

const { Text } = Typography;

const ChatMessageNode = ({ data, selected }) => {
    const { token } = theme.useToken();
    const isUser = data.role === 'user';
    const isSystem = data.role === 'system';

    // console.log(data);

    if (isSystem) {
        return (
            <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: token.colorBgLayout,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: token.colorTextSecondary,
                border: `1px solid ${token.colorBorder}`
            }}>
                •
                <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
                <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
            </div>
        );
    }

    const userColor = '#1677ff';
    const assistantColor = '#52c41a';
    const roleColor = isUser ? userColor : assistantColor;

    const getShadow = () => {
        if (selected) {
            return `0 0 0 4px ${roleColor}33`; // Selection indicator with role color
        }
        return token.boxShadowSecondary;
    };

    return (
        <div
            className={`chat-message-node ${isUser ? 'user-node' : 'assistant-node'} ${selected ? 'selected' : ''}`}
            style={{
                background: token.colorBgContainer,
                color: token.colorText,
                borderColor: selected ? roleColor : token.colorBorderSecondary,
                borderWidth: selected ? '2px' : '1px',
                boxShadow: getShadow(),
            }}
        >
            <Handle type="target" position={Position.Top} style={{ background: token.colorBorder }} />
            <div className="node-header">
                {isUser ? <UserOutlined style={{ color: userColor }} /> : <RobotOutlined style={{ color: assistantColor }} />}
                <Text strong style={{ fontSize: '11px', color: roleColor }}>
                    {isUser ? 'User' : 'Assistant'}
                </Text>
            </div>
            <div className="node-content" style={{ color: token.colorTextSecondary }}>
                {data.label}
            </div>
            <Handle type="source" position={Position.Bottom} style={{ background: token.colorBorder }} />
        </div>
    );
};

export default ChatMessageNode;
