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
        target: 'http://127.0.0.1:8888',
        changeOrigin: true,
        secure: false,
      },
      '/ask': {
        target: 'http://127.0.0.1:8888',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),  // Simplified path alias
    },
  },
  build: {
    outDir: "build",
    sourcemap: false,  // Disable source maps for production
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],  // Separates vendor libraries for caching
        },
      },
    },
  },
}));