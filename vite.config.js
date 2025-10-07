import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Listen on all interfaces (required for Docker)
    port: 3000,
    proxy: {
      "/api": "http://10.112.30.10:8000",
    },
  },
});
