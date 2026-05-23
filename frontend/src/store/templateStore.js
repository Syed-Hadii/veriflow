import { create } from "zustand";
import { getTemplateById, getTemplates } from "../services/templateService";

const useTemplateStore = create((set) => ({
	templates: [],
	template: null,
	isLoading: false,
	error: null,
	fetchTemplates: async (params = {}) => {
		set({ isLoading: true, error: null });
		try {
			const response = await getTemplates(params);
			set({
				templates: response?.data?.data || [],
				isLoading: false,
			});
		} catch (error) {
			set({
				error: error?.response?.data?.message || error.message,
				isLoading: false,
			});
		}
	},
	fetchTemplateById: async (id) => {
		if (!id) return;
		set({ isLoading: true, error: null, template: null });
		try {
			const response = await getTemplateById(id);
			set({
				template: response?.data?.data || null,
				isLoading: false,
			});
		} catch (error) {
			set({
				error: error?.response?.data?.message || error.message,
				isLoading: false,
			});
		}
	},
}));

export default useTemplateStore;
