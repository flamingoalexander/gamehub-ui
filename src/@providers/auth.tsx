import React, {
	createContext,
	FC,
	PropsWithChildren,
	useContext,
	useState,
} from "react";

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
