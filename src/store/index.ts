import { create } from "zustand";
import { Credentials, login as loginApi, logout as logoutApi } from "../api";

type UserState = {
	email: string | null;
	isAuthenticated: boolean;
};

type UserStateActions = {
	login: (credentials: Credentials) => Promise<void>;
	logout: () => void;
};

export const useStore = create<UserState & UserStateActions>((set) => ({
	email: null,
	isAuthenticated: false,
	login: async (credentials) => {
		await loginApi(credentials);
		set({
			isAuthenticated: true,
			email: credentials.email,
		});
	},
	logout: async () => {
		await logoutApi();
		set({
			isAuthenticated: false,
		});
	},
}));
