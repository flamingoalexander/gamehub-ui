import React, { FC, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Layout } from "antd";
import SideMenu from "../components/sideMenu";
import { Content } from "antd/es/layout/layout";
import AppHeader from "../components/header";
import Logo from "../components/logo";
import Sider from "antd/es/layout/Sider";
import { useAuth } from "../@providers/auth";

const MainPage: FC = () => {
	const [collapsed, setCollapsed] = useState(false);
	const { isAuthenticated } = useAuth();
	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}
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
					}}
				>
					<Outlet />
				</Content>
			</Layout>
		</Layout>
	);
};

export default MainPage;
