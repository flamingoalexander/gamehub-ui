import { create } from "zustand";
import {
	Credentials,
	login as loginApi,
	logout as logoutApi,
	getMe,
	getAvatar,
	uploadAvatar,
	MePatchPayload,
	patchMe,
} from "../api";
import { devtools } from "zustand/middleware";

type UserState = {
	email: string | null;
	isAuthenticated: boolean;
	username: string | null;
	_avatar: Blob | null;
	avatarUrl: string | null;
	description: string | null;
};

type UserActions = {
	login: (c: { email: string; password: string }) => Promise<void>;
	logout: () => Promise<void>;
	_fetchMe: () => Promise<void>;
	reset: () => void;
	_init: () => Promise<void>;
	_fetchAvatar: () => Promise<void>;
	patchAvatar: (avatar: File) => Promise<void>;
	patchMe: (data: MePatchPayload) => Promise<void>;
};

const initialState: UserState = {
	email: null,
	isAuthenticated: false,
	username: null,
	_avatar: null,
	description: null,
	avatarUrl: null,
};

export const useStore = create<UserState & UserActions>()(
	devtools(
		(set, get) => ({
			...initialState,
			reset: () => set({ ...initialState }),
			login: async (credentials: Credentials) => {
				await loginApi(credentials);
				set({ isAuthenticated: true, email: credentials.email });
				await get()._fetchMe();
				await get()._fetchAvatar();
			},
			logout: async () => {
				await logoutApi();
				get().reset();
			},

			_fetchMe: async () => {
				const { email, description, username } = await getMe();
				set({ email, description, username });
			},

			_fetchAvatar: async () => {
				const avatarBlob = await getAvatar();
				if (avatarBlob) {
					set({
						_avatar: avatarBlob,
						avatarUrl: URL.createObjectURL(avatarBlob),
					});
				}
			},

			patchAvatar: async (avatar: File) => {
				await uploadAvatar(avatar);
				await get()._fetchAvatar();
			},

			patchMe: async (data: MePatchPayload) => {
				const { email, description, username } = await patchMe(data);
				set({ email, description, username });
			},

			_init: async () => {
				try {
					if (!localStorage.getItem("accesstoken")) {
						get().reset();
						return;
					}
					await get()._fetchMe();
					set({ isAuthenticated: true });
					await get()._fetchAvatar();
				} catch (error) {
					console.error(error);
					get().reset();
					localStorage.removeItem("accesstoken");
				}
			},
		}),
		{ name: "UserStore" },
	),
);
