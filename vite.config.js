import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1", // Use IPv4 localhost
    port: 3000,         // Change to a free port
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
});