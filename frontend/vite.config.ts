import { defineConfig, type PluginOption } from "vite";
import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import vueDevTools from "vite-plugin-vue-devtools";

export default defineConfig(({ command }) => {
  const isDev = command === "serve"; // 只有 npm run dev 才是 serve

  const plugins: PluginOption[] = [
    vue(),
    tailwindcss(),
    isDev && vueDevTools(), // 只在開發時啟用
  ].filter(Boolean);

  return {
    plugins,
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)), // 加這一行，引入@開頭的路徑就可以正常解析
      },
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:3000", // 後端 Node
          changeOrigin: true,
        },
      },
    },
  };
});
