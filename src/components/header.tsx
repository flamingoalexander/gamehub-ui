import React, { FC } from "react";
import { Header } from "antd/es/layout/layout";
import { Flex } from "antd";
import Title from "antd/es/typography/Title";

const AppHeader: FC = () => {
	return (
		<Header>
			<Flex justify="space-between" align="center" style={{ height: "100%" }}>
				<Title level={2} style={{ height: "100%" }}>
					GameHub
				</Title>
			</Flex>
		</Header>
	);
};

export default AppHeader;
