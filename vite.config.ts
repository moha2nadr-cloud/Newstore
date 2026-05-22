import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

const isVercel = process.env.VERCEL === "1";
const isCapacitor = process.env.CAPACITOR_BUILD === "1";

export default defineConfig({
  tanstackStart: {
    server: {
      ...(isVercel || isCapacitor ? {} : { entry: "server" }),
    },
  },
  ...(isVercel || isCapacitor ? { cloudflare: false } : {}),
  ...(isVercel
    ? {
        vite: {
          plugins: [nitro({ preset: "vercel" })],
        },
      }
    : {}),
});
