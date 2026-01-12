import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import process from "node:process";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_URL || "http://10.112.30.10:8000";

  return {
    plugins: [react()],
    css: {
      postcss: {
        plugins: [tailwindcss(), autoprefixer()],
      },
    },
    server: {
      host: "0.0.0.0", // Listen on all interfaces (required for Docker)
      port: 3000,
      proxy: {
        "/api": apiTarget,
        "/download": apiTarget,
        "/content": apiTarget,
      },
    },
    // Handle client-side routing - serve index.html for all non-asset routes
    appType: "spa",
  };
});
