import React, { FC } from "react";
import { Header } from "antd/es/layout/layout";
import { Button, Flex } from "antd";
import Title from "antd/es/typography/Title";
import { UserOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

const AppHeader: FC = () => {
	return (
		<Header>
			<Flex justify="space-between" align="center" style={{ height: "100%" }}>
				<Title level={2} style={{ height: "100%" }}>
					GameHub
				</Title>
				<Link to="/profile">
					<Button type="primary" icon={<UserOutlined />}>
						Личный кабинет
					</Button>
				</Link>
			</Flex>
		</Header>
	);
};

export default AppHeader;
