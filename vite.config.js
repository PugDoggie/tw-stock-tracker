import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // HTTPS configuration for secure development
    https:
      process.env.VITE_HTTPS === "true"
        ? {
            // For production, use real certificates
            // For development, Vite will auto-generate self-signed cert
          }
        : false,
    host: true, // Allow external access
    port: 5173,
    // PROXY DISABLED - Using direct client-side fetch instead
    // This avoids Vite proxy's socket hang up issues with TWSE
  },
  // Build optimizations - IMPROVED PERFORMANCE
  build: {
    target: "ES2020",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          charts: ["lightweight-charts"],
          motion: ["framer-motion"],
        },
        chunkFileNames: "chunks/[name]-[hash].js",
        entryFileNames: "[name]-[hash].js",
      },
    },
    minify: "esbuild",
    cssMinify: true,
    sourcemap: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 500,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ["react", "react-dom", "lightweight-charts", "framer-motion"],
  },
});
