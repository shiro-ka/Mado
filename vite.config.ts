import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { SvelteKitPWA } from "@vite-pwa/sveltekit";

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
  plugins: [
    tailwindcss(),
    sveltekit(),
    SvelteKitPWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: {
        name: "Mado (窓) - 半匿名質問箱",
        short_name: "Mado",
        description: "ATProtocol基盤の半匿名質問箱。送り主はあなただけに届きます。",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0a0a0f",
        theme_color: "#7c3aed",
        icons: [
          {
            src: "/icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/icons/icon-maskable.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["client/**/*.{js,css,ico,png,svg,webp,woff,woff2}"],
      },
    }),
  ],
});
