import React, {
	useContext,
	useState,
	createContext,
	PropsWithChildren,
	FC,
} from "react";
import {
	BrowserRouter as Router,
	Navigate,
	Outlet,
	Route,
	Routes,
} from "react-router-dom";
import SeaBattle from "../components/seaBattle";
import { Layout } from "antd";
import Welcome from "../components/hello";
import TicTacToe from "../components/tictactoe";
import Profile from "../components/profile";
import AuthorizationForm from "../pages/auth";
import { Content } from "antd/es/layout/layout";
import AppHeader from "../components/header";
import SideMenu from "../components/sideMenu";
import Sider from "antd/es/layout/Sider";
import Logo from "../components/logo";

export type AuthContextType = {
	isAuthenticated: boolean;
	login: () => void;
	logout: () => void;
};
export type FCC<T = unknown> = FC<PropsWithChildren<T>>;
const AuthContext = createContext<AuthContextType>({
	isAuthenticated: false,
	login: () => {},
	logout: () => {},
});

export const AuthProvider: FCC = ({ children }) => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	const login = () => {
		setIsAuthenticated(true);
	};

	const logout = () => {
		setIsAuthenticated(false);
	};

	return (
		<AuthContext.Provider value={{ isAuthenticated, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth: () => AuthContextType = () => useContext(AuthContext);

const ProtectedLayout = () => {
	const { isAuthenticated } = useAuth();
	const [collapsed, setCollapsed] = useState(false);

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
						background: "#fff",
					}}
				>
					<Outlet />
				</Content>
			</Layout>
		</Layout>
	);
};

const App = () => {
	return (
		<AuthProvider>
			<Router>
				<Routes>
					<Route path="/login" element={<AuthorizationForm />} />
					<Route path="/" element={<ProtectedLayout />}>
						<Route index element={<Welcome />} />
						<Route path="tictactoe" element={<TicTacToe />} />
						<Route path="seabattle" element={<SeaBattle />} />
						<Route path="profile" element={<Profile />} />
					</Route>
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</Router>
		</AuthProvider>
	);
};

export default App;
