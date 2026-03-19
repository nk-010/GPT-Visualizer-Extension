import { Typography } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import { Handle, Position } from '@xyflow/react';

const { Text } = Typography;

const ChatMessageNode = ({ data, selected }) => {
    const isUser = data.role === 'user';
    const isAssistant = data.role === 'assistant';
    const isSystem = data.role === 'system';

    // console.log(data);

    if (isSystem) {
        return (
            <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#d1d5db',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: '#4b5563',
                border: '1px solid #9ca3af'
            }}>
                •
                <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
                <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
            </div>
        );
    }

    return (
        <div className={`chat-message-node ${isUser ? 'user-node' : 'assistant-node'} ${selected ? 'selected' : ''}`}>
            <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
            <div className="node-header">
                {isUser ? <UserOutlined style={{ color: '#1677ff' }} /> : <RobotOutlined style={{ color: '#52c41a' }} />}
                <Text strong style={{ fontSize: '11px', color: isUser ? '#1677ff' : '#52c41a' }}>
                    {isUser ? 'User' : 'Assistant'}
                </Text>
            </div>
            <div className="node-content">
                {data.label}
            </div>
            <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
        </div>
    );
};

export default ChatMessageNode;
