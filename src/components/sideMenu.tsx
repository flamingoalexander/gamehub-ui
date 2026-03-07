import { Menu, MenuProps } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import React from "react";
import {
	HomeOutlined,
	IdcardOutlined,
	TrophyOutlined,
	StarOutlined,
} from "@ant-design/icons";
export const menuItems: MenuProps["items"] = [
	{
		key: "/",
		icon: <HomeOutlined />,
		label: <Link to="/">Главная</Link>,
	},
	{
		key: "/profile",
		icon: <IdcardOutlined />,
		label: <Link to="/profile">Профиль</Link>,
	},
	{
		key: "/leaderboard",
		icon: <TrophyOutlined />,
		label: <Link to="/leaderboard">Таблица лидеров</Link>,
	},
	{
		key: "/achievements",
		icon: <StarOutlined />,
		label: <Link to="/achievements">Достижения</Link>,
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
