/**
 * main.jsx — application entry point.
 *
 * createRoot mounts the React tree into the #root div from index.html.
 * StrictMode helps catch common mistakes in development (double-invokes
 * some lifecycles on purpose).
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./app.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
