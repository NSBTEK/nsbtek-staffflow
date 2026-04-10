import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const isGithubPages = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  base: isGithubPages ? "/nsbtek-staffflow/" : "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
