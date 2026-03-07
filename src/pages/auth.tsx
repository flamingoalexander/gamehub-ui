import React from "react";
import { Flex } from "antd";
import { Navigate, Outlet } from "react-router-dom";
import { useStore } from "../store";

const AuthorizationWrapper = () => {
	const isAuthenticated = useStore((state) => state.isAuthenticated);
	if (isAuthenticated) {
		return <Navigate to="/" replace />;
	}
	return (
		<Flex justify="center" align={"center"} style={{ height: "80vh" }}>
			<Outlet />
		</Flex>
	);
};

export default AuthorizationWrapper;
