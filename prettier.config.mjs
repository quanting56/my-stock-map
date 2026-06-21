/**
 * @type {
 *   import("prettier").Config
 *   & import("prettier-plugin-tailwindcss").PluginOptions
 * }
 */
const config = {
  // 載入 Tailwind 官方的 Prettier plugin，依官方建議順序排列 Tailwind class
  // 一般執行 ESLint 時，格式差異會透過 prettier/prettier 顯示成 warning
  // 但執行 eslint --fix、prettier --write 或啟用儲存時自動修正，仍會自動修改程式碼
  plugins: ["prettier-plugin-tailwindcss"], // 假如未來加入其他 Prettier plugin，Tailwind plugin 必須放最後

  printWidth: 120, // 一行建議寬度 → 這不是絕對最大長度，而是 Prettier 判斷是否換行的重要依據
  tabWidth: 2, // 使用 2 個空格縮排
  useTabs: false, // 不使用 Tab 字元
  semi: true, // JavaScript / TypeScript 保留分號
  singleQuote: false, // false 代表 JavaScript / TypeScript 字串使用雙引號
  quoteProps: "as-needed", // 只有必要時才替物件 property 加引號
  trailingComma: "all", // 多行參數、陣列、物件等保留尾逗號
  bracketSpacing: true, // 物件的大括號內保留空格，e.g. '{ name: "TSMC" }'
  bracketSameLine: false, // 多行 Vue / HTML 標籤的 > 放在下一行
  arrowParens: "always", // 箭頭函式只有一個參數時也保留括號，e.g. '(value) => value'
  endOfLine: "lf", // Git 與 macOS/Linux 常用的 LF 換行，也就是 \n
  singleAttributePerLine: false, // 不強迫 Vue template 每個 attribute 都獨占一行，太長時 Prettier 才建議拆行
  vueIndentScriptAndStyle: false, // Vue SFC 的 script 與 style 內容不額外縮排

  // =========
  // 下面兩項只能依 Tailwind 版本選一項
  // 終端機執行 'npm ls tailwindcss' 確認版本
  // =========

  // Tailwind CSS v4 → 改成實際包含 '@import "tailwindcss";' 的 CSS 入口檔
  // 常見位置：
  // - tailwindStylesheet: "./src/style.css",
  // - tailwindStylesheet: "./src/assets/main.css",
  tailwindStylesheet: "./src/style.css",

  // Tailwind CSS v3 → 指向專案的 Tailwind 設定檔
  // 常見位置：
  // - tailwindConfig: "./tailwind.config.js",
};

export default config;
