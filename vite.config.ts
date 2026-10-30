import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  ssr: {
    external: [
      "@cf-wasm/og",
      "@cf-wasm/og/workerd",
      "@cf-wasm/og/html-to-react",
      "@cf-wasm/resvg",
      "@cf-wasm/satori",
      "@cf-wasm/internals",
    ],
  },
  plugins: [sveltekit()],
});
