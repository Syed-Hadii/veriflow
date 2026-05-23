import { useContext } from "react";
import { LanguageContext } from "./languageContext";

export default function useLanguage() {
  return useContext(LanguageContext);
}
