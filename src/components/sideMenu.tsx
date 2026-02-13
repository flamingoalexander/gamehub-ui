import { Menu, MenuProps } from "antd";
import {
	DashboardOutlined,
	HomeOutlined,
	UserOutlined,
} from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import React from "react";

const menuItems: MenuProps["items"] = [
	{
		key: "/",
		icon: <HomeOutlined />,
		label: <Link to="/">Главная</Link>,
	},
	{
		key: "/tictactoe",
		icon: <DashboardOutlined />,
		label: <Link to="/tictactoe">Крестики-нолики</Link>,
	},
	{
		key: "/seabattle",
		icon: <UserOutlined />,
		label: <Link to="/seabattle">Морской бой</Link>,
	},
];

const SideMenu: React.FC = () => {
	const location = useLocation();
	const navigate = useNavigate();

	const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
		navigate(key);
	};

	return (
		<Menu
			mode="inline"
			selectedKeys={[location.pathname]}
			items={menuItems}
			onClick={handleMenuClick}
			theme="dark"
		/>
	);
};

export default SideMenu;
