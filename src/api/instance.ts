import axios from "axios";
import { refresh, tokenStorage } from "./index";
import { useStore } from "../store";

const $api = axios.create({
	baseURL: "api/",
});

$api.interceptors.request.use((config) => {
	const token = tokenStorage.get();
	if (token) config.headers.Authorization = `Bearer ${token}`;
	return config;
});

let retry = false;

$api.interceptors.response.use(
	(res) => res,
	async (error) => {
		const original = error.config;
		const status = error?.response?.status;
		if (status !== 401) {
			return Promise.reject(error);
		}
		if (retry) {
			return Promise.reject(error);
		}
		retry = true;
		try {
			const { access: newAccessToken } = await refresh();
			tokenStorage.set(newAccessToken);
			retry = false;
			return $api(original);
		} catch (e) {
			tokenStorage.clear();
			useStore.setState({ isAuthenticated: false });
			retry = false;
			return Promise.reject(e);
		}
	},
);

export default $api;
