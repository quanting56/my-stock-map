import { defineConfig } from "vite";
import path from "path";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss()
  ],
  base: "/my-stock-map/",
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
