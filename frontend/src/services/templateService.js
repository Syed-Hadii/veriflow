import api from "./api";

export const getTemplates = (params = {}) => api.get("/templates", { params });

export const getTemplateById = (id) => api.get(`/templates/${id}`);
