// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",  // Allows IPv6 connections
    port: 8050,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001/arabicchatbot-24bb2/us-central1',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      },
      '/api/ask_user': {
        target: 'http://127.0.0.1:5001/arabicchatbot-24bb2/us-central1/ask_user',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => ''
      },
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "build",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
        },
      },
    },
  },
}));