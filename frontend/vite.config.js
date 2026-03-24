/**
 * Vite configuration for the inventory-monitor frontend (/frontend).
 *
 * This file tells Vite how to build and serve the app. The React plugin
 * enables JSX in .jsx files and fast refresh during development.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
