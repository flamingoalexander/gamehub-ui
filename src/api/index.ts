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

export const register = async (credentials: Credentials) => {
	console.log(credentials);
	console.log(await $api.post<LoginResponse>("/register/", credentials));
	alert("вы зарегестрировались");
};

export const logout = async () => {
	await $api.post<LoginResponse>("/logout/");
	tokenStorage.clear();
};

type RefreshResponse = {
	access: string;
};

export const refresh = async () => {
	const { data } = await $api.post<RefreshResponse>("/refresh/");
	return data;
};
