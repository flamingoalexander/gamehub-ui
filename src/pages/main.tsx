import React from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "antd";
import SideMenu from "../components/sideMenu";
import Profile from "../components/profile";
import SeaBattle from "../components/seaBattle";
import TicTacToe from "../components/tictactoe";
import Welcome from "../components/hello";
import { Content } from "antd/es/layout/layout";
import AppHeader from "../components/header";
import Logo from "../components/logo";
import Sider from "antd/es/layout/Sider";
import AuthorizationForm from "./auth";

const MainPage: React.FC = () => {
	const [collapsed, setCollapsed] = React.useState(false);

	return (
		<Layout style={{ minHeight: "100vh" }}>
			<Sider
				breakpoint="lg"
				collapsedWidth={0}
				collapsible
				collapsed={collapsed}
				onCollapse={(value) => setCollapsed(value)}
				trigger={null}
				onBreakpoint={(broken) => setCollapsed(broken)}
			>
				<Logo collapsed={collapsed} />
				<SideMenu />
			</Sider>
			<Layout>
				<AppHeader />
				<Content
					style={{
						margin: 16,
						padding: 24,
						minHeight: 280,
						borderRadius: 8,
						background: "#fff",
					}}
				>
					<Routes>
						<Route path="/" element={<Welcome />} />
						<Route path="/tictactoe" element={<TicTacToe />} />
						<Route path="/seabattle" element={<SeaBattle />} />
						<Route path="/profile" element={<Profile />} />
						<Route path="/login" element={<AuthorizationForm />} />
					</Routes>
				</Content>
			</Layout>
		</Layout>
	);
};

export default MainPage;
