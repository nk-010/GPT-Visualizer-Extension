import { Layout, theme } from "antd";
import Outlet from "./Outlet";
import Nav from "./Nav";

const { Content } = Layout;

export default function AppLayout() {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Nav />
      <Content style={{ padding: "16px 5px" }}>

      </Content>
    </Layout>
  );
}
