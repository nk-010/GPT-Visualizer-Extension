import { Layout, theme } from "antd";
import Nav from "./Nav";
import ChatVisualizer from "../chat/ChatVisualizer";

const { Content } = Layout;

export default function AppLayout() {
  const {
    token,
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: "100vh", background: token.colorBgLayout }}>
      <Nav />
      <Content style={{ padding: "16px 5px", background: 'transparent' }}>
        <ChatVisualizer />
      </Content>
    </Layout>
  );
}
