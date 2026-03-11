import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { mochaPlugins } from "@getmocha/vite-plugins";

// Detect if running on Vercel CI
const isVercel = process.env.VERCEL === "true" || process.env.NOW_VERCEL || process.env.CI === "true";

export default defineConfig({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [
    ...(!isVercel ? mochaPlugins(process.env as any) : []),
    react(),
    // Only add Cloudflare plugin when NOT on Vercel
    ...(isVercel ? [] : [cloudflare()]),
  ],
  server: {
    allowedHosts: true,
  },
  build: {
    // For Vercel: output to dist root
    // For Cloudflare: let the plugin handle it
    outDir: isVercel ? "dist" : undefined,
    emptyOutDir: true,
    chunkSizeWarningLimit: 5000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

