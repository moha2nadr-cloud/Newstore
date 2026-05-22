import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isCapacitor = process.env.CAPACITOR_BUILD === "1";

export default defineConfig({
  tanstackStart: {
    server: {
      entry: "server",
    },
  },
  ...(isCapacitor ? { cloudflare: false } : {}),
});
