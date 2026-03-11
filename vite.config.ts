import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { mochaPlugins } from "@getmocha/vite-plugins";

// Only use Cloudflare plugin when NOT on Vercel
const isVercel = process.env.VERCEL === "true" || process.env.NOW_VERCEL;

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
    // For Vercel: output to dist (not dist/client)
    // For Cloudflare: let the plugin handle it
    outDir: isVercel ? "dist" : undefined,
    chunkSizeWarningLimit: 5000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

