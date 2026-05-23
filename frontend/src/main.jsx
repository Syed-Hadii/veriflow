import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import ThemeProvider from "./theme/ThemeProvider";
import { LanguageProvider } from "./i18n";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>
  </BrowserRouter>,
);
