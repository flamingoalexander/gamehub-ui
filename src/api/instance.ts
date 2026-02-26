import axios from "axios";
import { refresh, tokenStorage } from "./index";

const $api = axios.create({
	baseURL: "api/",
});

$api.interceptors.request.use((config) => {
	const token = tokenStorage.get();
	if (token) config.headers.Authorization = `Bearer ${token}`;
	return config;
});

$api.interceptors.response.use(
	(res) => res,
	async (error) => {
		const original = error.config;
		const status = error?.response?.status;

		if (status !== 401 || original?._retry) {
			throw error;
		}
		original._retry = true;
		const { access: newAccessToken } = await refresh();
		tokenStorage.set(newAccessToken);
		try {
			const { access: newAccessToken } = await refresh();
			tokenStorage.set(newAccessToken);
			return $api(original);
		} catch (e) {
			tokenStorage.clear();
			return Promise.reject(e);
		}
	},
);

export default $api;
