import $api from "./instance";

export type Credentials = {
	email: string;
	password: string;
};
type LoginResponse = {
	access: string;
};

export const tokenStorage = {
	key: "accesstoken",
	get: () => localStorage.getItem(tokenStorage.key),
	set: (value: string) => localStorage.setItem(tokenStorage.key, value),
	clear: () => localStorage.removeItem(tokenStorage.key),
};

export const login = async (credentials: Credentials) => {
	console.log(credentials);
	const { data } = await $api.post<LoginResponse>("/login/", credentials);
	tokenStorage.set(data.access);
};

export type RegisterPayload = Credentials & {
	username: string;
};

export const register = async (credentials: RegisterPayload) => {
	await $api.post<LoginResponse>("/register/", credentials);
};

export const logout = async () => {
	await $api.post<LoginResponse>("/logout/");
	tokenStorage.clear();
};

type RefreshResponse = {
	access: string;
};

export const refresh = async () => {
	const { data } = await $api.post<RefreshResponse>("/token/refresh/");
	return data;
};

export type MeResponse = {
	id: number;
	email: string;
	username: string;
	created_at: string;
	updated_at: string;
	description: string;
};
export const getMe = async (): Promise<MeResponse> => {
	const { data } = await $api.get<MeResponse>("/me/all/");
	return data;
};

export type MePatchPayload = Partial<
	Pick<MeResponse, "username" | "description">
>;

export const patchMe = async (payload: MePatchPayload): Promise<MeResponse> => {
	const { data } = await $api.patch<MeResponse>("/me/all/", payload);
	return data;
};

export const getAvatar = async (): Promise<Blob | null> => {
	try {
		const { data } = await $api.get("/me/avatar/", { responseType: "blob" });
		return data;
	} catch {
		return null;
	}
};

export const uploadAvatar = async (file: File): Promise<void> => {
	const formData = new FormData();
	formData.append("avatar", file);
	const { data } = await $api.post("/me/avatar/", formData);
	console.log(data);
};

export type Game = {
	name: string;
	description: string;
	picture: string;
};
export const getGames = async (): Promise<Game[]> => {
	const { data } = await $api.get<Game[]>("/game/all/");
	return data;
};
