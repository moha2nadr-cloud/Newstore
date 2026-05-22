import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isVercel = process.env.VERCEL === "1";
const isCapacitor = process.env.CAPACITOR_BUILD === "1";
const noCloudflare = isVercel || isCapacitor;

export default defineConfig({
  tanstackStart: {
    server: {
      entry: "server",
      ...(isVercel ? { preset: "vercel" } : {}),
    },
  },
  ...(noCloudflare ? { cloudflare: false } : {}),
});
