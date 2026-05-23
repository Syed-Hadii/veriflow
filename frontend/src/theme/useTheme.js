import { useContext } from "react";
import { ThemeContext } from "./themeContext";

export default function useTheme() {
  return useContext(ThemeContext);
}
