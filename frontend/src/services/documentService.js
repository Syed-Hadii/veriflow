import api from "./api";

export const createDocument = (payload, token) =>
	api.post("/docs", payload, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

export const downloadDocument = (id, format, token) =>
	api.get(`/docs/${id}/download`, {
		params: { format },
		responseType: "blob",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
