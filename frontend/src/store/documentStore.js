import { create } from "zustand";

const useDocumentStore = create(() => ({
	lastCreatedId: "",
}));

export default useDocumentStore;
