import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import ssr from "vite-plugin-ssr/plugin";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ssr({ prerender: true }),
    VitePWA({ registerType: "autoUpdate" }),
  ],
});
