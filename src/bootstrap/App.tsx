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

const BASE_URL = process.env.REACT_APP_API_URL ?? "http://localhost:8000";

// ─── Типы ─────────────────────────────────────────────────────────────────────

export type AuthContextType = {
	isAuthenticated: boolean;
	login: (email: string, password: string) => Promise<void>;
	logout: () => void;
};
export type FCC<T = unknown> = FC<PropsWithChildren<T>>;

// ─── API ──────────────────────────────────────────────────────────────────────

export async function apiLogin(email: string, password: string): Promise<string> {
	const res = await fetch(`${BASE_URL}/api/login/`, {
		method: "POST",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password }),
	});
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body?.detail ?? body?.error ?? "Неверный email или пароль");
	}
	const data = await res.json();
	return data.access as string;
}

export async function apiLogout(): Promise<void> {
	await fetch(`${BASE_URL}/api/logout/`, {
		method: "POST",
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${localStorage.getItem("access_token") ?? ""}`,
		},
	}).catch(() => {});
}

// ─── Auth Context ─────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>({
	isAuthenticated: false,
	login: async () => {},
	logout: () => {},
});

export const AuthProvider: FCC = ({ children }) => {
	// Проверяем наличие токена при старте — восстанавливаем сессию
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
		() => !!localStorage.getItem("access_token")
	);

	const login = async (email: string, password: string) => {
		const token = await apiLogin(email, password);
		localStorage.setItem("access_token", token);
		setIsAuthenticated(true);
	};

	const logout = () => {
		apiLogout();
		localStorage.removeItem("access_token");
		setIsAuthenticated(false);
	};

	return (
		<AuthContext.Provider value={{ isAuthenticated, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth: () => AuthContextType = () => useContext(AuthContext);

// ─── Protected Layout ─────────────────────────────────────────────────────────

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

// ─── App ──────────────────────────────────────────────────────────────────────

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