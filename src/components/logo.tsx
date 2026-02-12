import React from "react";
import { Link } from "react-router-dom";
import { Space } from "antd";
import Title from "antd/es/typography/Title";

const Logo: React.FC<{ collapsed: boolean }> = ({ collapsed }) => (
	<Link to="/">
		<Space
			align="center"
			style={{
				padding: "16px",
				justifyContent: "center",
				width: "100%",
				display: "flex",
			}}
		>
			<img
				src="logo512.png"
				alt="logo"
				style={{
					height: 36,
					width: 36,
					borderRadius: 8,
				}}
			/>
			{!collapsed && (
				<Title
					level={5}
					style={{
						color: "white",
						margin: 0,
						whiteSpace: "nowrap",
					}}
				>
					Game Hub
				</Title>
			)}
		</Space>
	</Link>
);

export default Logo;
