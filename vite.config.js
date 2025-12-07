import { defineConfig } from "vite";
import path from "path";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

const IS_GH_PAGES = process.env.VITE_DEPLOY_TARGET === "gh-pages";

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss()
  ],
  base: IS_GH_PAGES ? "/my-stock-map/" : "/",  // 為了可部署在 gh-pages，加這個條件式
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")  // 加這一行，引入@開頭的路徑就可以正常解析
    }
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",  // 後端 Node
        changeOrigin: true,
      },
    },
  },
});
