import React from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Link,
	useLocation,
} from "react-router-dom";
import { Layout, Menu, MenuProps } from "antd";
import { DashboardOutlined, UserOutlined } from "@ant-design/icons";
import TicTacToe from "./tictactoe";
import SeaBattle from "./seaBattle";
import Profile from "./profile";
import AppHeader from "./header";
import Welcome from "./hello";
const { Sider, Content } = Layout;

const menuItems: MenuProps["items"] = [
	{
		key: "/tictactoe",
		icon: <DashboardOutlined />,
		label: <Link to="/tictactoe">Крестики-нолики</Link>,
	},
	{
		key: "/seabattle",
		icon: <UserOutlined />,
		label: <Link to="/seabattle">Пользователи</Link>,
	},
];
const SideMenu = () => {
	const location = useLocation();
	return (
		<Menu mode="inline" selectedKeys={[location.pathname]} items={menuItems} />
	);
};

const App: React.FC = () => {
	return (
		<Router>
			<Layout style={{ minHeight: "100vh" }}>
				<Sider breakpoint="lg" collapsedWidth="0">
					<img src="logo512.png" style={{ height: 40, width: 40 }} alt="logo" />
					<SideMenu />
				</Sider>
				<Layout>
					<AppHeader />
					<Content style={{ margin: 16 }}>
						<Routes>
							<Route path="/tictactoe" element={<TicTacToe />} />
							<Route path="/seabattle" element={<SeaBattle />} />
							<Route path="/profile" element={<Profile />} />
							<Route path="/" element={<Welcome />} />
						</Routes>
					</Content>
				</Layout>
			</Layout>
		</Router>
	);
};

export default App;
