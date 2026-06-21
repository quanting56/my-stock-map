import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import pluginVue from "eslint-plugin-vue";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

// TypeScript Project Service 解析 Vue SFC 時需要知道 .vue 是額外副檔名
// TypeScript 與 Vue 設定共用同一個陣列，也能避免 Project Service，因 extraFileExtensions 不一致而重複重新載入專案
const extraFileExtensions = [".vue"];

// JavaScript 與 TypeScript 共用的未使用變數設定
const unusedVarsOptions = {
  argsIgnorePattern: "^_", // 未使用的函式參數若以 _ 開頭則忽略，e.g. 'function handler(_event, value) {}'
  varsIgnorePattern: "^_", // 未使用的區域變數若以 _ 開頭則忽略，e.g. 'const _temporaryValue = result;'
  caughtErrors: "all", // 'catch (error) {}' 的 error 也納入未使用檢查
  caughtErrorsIgnorePattern: "^_", // catch 的錯誤參數以 _ 開頭時忽略
};

export default defineConfig([
  // ESLint 10 已經不再讀取 .eslintignore，要忽略的檔案與資料夾直接寫在這裡
  globalIgnores([
    "node_modules/**",
    "dist/**",
    "coverage/**",
    "**/*.min.js",

    // TODO: 臨時後端目前不納入 ESLint，待正式重構 Node.js 後再移除
    "server/**",

    // TODO: 臨時 mock data 目前不納入檢查，待移除假資料時再移除
    "src/data/mock/**",
  ]),

  // =========================================================
  // 一般 JavaScript 檔案，對 .js / .mjs / .cjs 的檢查
  // =========================================================
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [
      js.configs.recommended, // ESLint 官方 JavaScript recommended 規則 → 主要檢查未定義變數、無法執行的程式碼等問題
    ],
    languageOptions: {
      ecmaVersion: "latest",
    },
    rules: {
      // JavaScript 的未使用變數也只顯示 warning
      "no-unused-vars": ["warn", unusedVarsOptions],
    },
  },

  // =========================================================
  // TypeScript 檔案，對 ts / mts / cts 的檢查
  // 使用 recommendedTypeChecked → 包含一般 TypeScript recommended 規則，並啟用需要型別資訊的檢查，透過 projectService 讀取最接近各檔案的 tsconfig.json
  // =========================================================
  {
    files: ["**/*.{ts,mts,cts}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked, // 包含一般 recommended，並額外啟用需要 TypeScript 型別資訊的推薦規則
    ],
    languageOptions: {
      ecmaVersion: "latest",
      parserOptions: {
        projectService: true, // 使用最接近每個檔案的 tsconfig.json 取得型別資訊
        tsconfigRootDir: import.meta.dirname, // 明確指定專案根目錄，避免從其他目錄執行 ESLint 時找錯 tsconfig
        extraFileExtensions, // 讓 Project Service 同時認得 Vue SFC
      },
    },
    rules: {
      // 未使用變數先顯示黃色 warning，不直接當成紅色 error
      // 底線開頭代表你刻意暫時不使用，e.g. 'const _temporaryValue = ...'
      "@typescript-eslint/no-unused-vars": ["warn", unusedVarsOptions],

      // 專案需要 any 的話，先提示但不阻止檢查通過
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  // =========================================================
  // Browser 環境
  // 只將瀏覽器 globals 套用到真正的前端原始碼，避免 vite.config.ts、eslint.config.mjs 等 Node 設定檔也錯誤獲得 window、document 等全域變數
  // =========================================================
  {
    files: ["src/**/*.{js,mjs,ts,mts}"],
    languageOptions: {
      globals: globals.browser,
    },
  },

  // =========================================================
  // Vue Single File Component
  // .vue 裡的 template 與 <script setup lang="ts"> 都會檢查
  // =========================================================
  {
    files: ["**/*.vue"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked, // 包含一般 TypeScript recommended，並啟用需要型別資訊的推薦規則

      // Vue recommended 比 essential 多一些可讀性與慣例提示
      // 真正可能造成錯誤的規則通常是 error，純建議性規則通常是 warning
      pluginVue.configs["flat/recommended"],
    ],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,

      parserOptions: {
        // .vue 最外層仍由 vue-eslint-parser 處理
        // 其中的 <script lang="ts"> 交給 typescript-eslint parser
        parser: tseslint.parser,

        projectService: true, // 啟用需要 TypeScript 型別資訊的 ESLint 規則
        tsconfigRootDir: import.meta.dirname, // 從 eslint.config.mjs 所在位置尋找 tsconfig
        extraFileExtensions, // Project Service 必須知道 .vue 是額外副檔名
      },
    },

    rules: {
      // 允許 Home.vue、Login.vue、Dashboard.vue 這類單字元件名稱
      "vue/multi-word-component-names": "off",

      // 不強迫空元件一定寫成 <MyComponent />
      // 以下兩種寫法都可：
      // - <MyComponent />
      // - <MyComponent></MyComponent>
      "vue/html-self-closing": "off",

      "@typescript-eslint/no-unused-vars": ["warn", unusedVarsOptions],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  // =========================================================
  // Node.js ESM 設定檔與 scripts
  // 以下設定假設專案使用 Vite 常見的 ESM 設定，也就是 package.json 具有 "type": "module"，或檔案本身使用 .mjs / .mts
  // =========================================================
  {
    files: ["*.config.{js,mjs,ts,mts}", "scripts/**/*.{js,mjs,ts,mts}"],
    languageOptions: {
      sourceType: "module",

      // ESM Node 檔案只允許真正的 Node 全域物件，例如 process、Buffer；不會錯誤允許 require、module、__dirname。
      globals: globals.nodeBuiltin,
    },
  },

  // =========================================================
  // Node.js CommonJS
  // .cjs 與 .cts 明確視為 CommonJS
  // =========================================================
  {
    files: ["**/*.{cjs,cts}"],
    languageOptions: {
      sourceType: "commonjs",

      // CommonJS 可以使用 process、Buffer、require、module、exports、__dirname、__filename 等內容
      globals: globals.node,
    },
  },

  // =========================================================
  // 將 Prettier 的格式差異轉成 ESLint 提示
  // 這裡只套用在 ESLint 能直接解析的程式碼 → JavaScript、TypeScript、Vue
  // CSS、JSON、Markdown 另外由 prettier --check 檢查
  // =========================================================
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,vue}"],

    // recommended 同時完成：
    // - 啟用 eslint-plugin-prettier
    // - 啟用 eslint-config-prettier
    // - 關閉會與 Prettier 打架的 ESLint 格式規則
    extends: [eslintPluginPrettierRecommended],

    rules: {
      // 預設 recommended 會將格式問題視為 error，因此改成 warn，此時 VS Code 中通常會顯示成黃色波浪線
      "prettier/prettier": "warn",
    },
  },
]);
