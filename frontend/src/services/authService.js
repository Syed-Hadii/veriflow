import api from "./api";

export const signup = (payload) => api.post("/auth/signup", payload);

export const login = (payload) => api.post("/auth/login", payload);

export const getMe = (token) =>
	api.get("/auth/me", {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

export const updateProfile = (token, payload) =>
	api.put("/auth/profile", payload, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
