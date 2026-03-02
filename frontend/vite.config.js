import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          motion: ["motion"],
          three: ["three", "@react-three/fiber", "postprocessing"],
          charts: ["chart.js", "react-chartjs-2"],
          editor: ["@excalidraw/excalidraw"],
        },
      },
    },
  },
});
