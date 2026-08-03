# My Stock Map / 投資可視化系統

**My Stock Map** 是一個以 **個人記帳**、**長期投資管理** 與 **投資資料視覺化** 為核心的專案。

專案目前以 **臺股資料** 為主，目標是協助使用者快速管理持股、檢視資產配置、追蹤個股價格走勢、查看基本面摘要與新聞資訊，並逐步加入投資策略回測與報表匯出功能。前端使用 **Vue 3 + Vite + Pinia + D3.js + Tailwind CSS + TypeScript** 開發；後端使用 SQLite 與 JSON 快取歷史股價、股票清單及市值排名資料，以整合 TWSE、TAIFEX、FinMind、GDELT 與 Google News 等公開資料來源。

> ⚠️ **免責聲明**：本專案僅供個人學習、作品集展示與技術實驗使用，所有資料與分析結果都不構成任何投資建議。投資前請自行評估風險承受能力。

<!-- version tag (TODO: 以後前端和後端有分別的版本號時使用) -->

<!-- ![Version](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/quanting56/my-stock-map/main/frontend/package.json&query=$.version&prefix=v&label=version)
![Version](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/quanting56/my-stock-map/main/backend/package.json&query=$.version&prefix=v&label=version) -->

<!-- frontend -->

[![Vue](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fquanting56%2Fmy-stock-map%2Fmain%2Ffrontend%2Fpackage.json&query=%24.dependencies.vue&label=Vue&logo=vuedotjs&color=4FC08D)](https://vuejs.org/)
[![Pinia](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fquanting56%2Fmy-stock-map%2Fmain%2Ffrontend%2Fpackage.json&query=%24.dependencies.pinia&label=Pinia&logo=pinia&color=FFD859)](https://pinia.vuejs.org/)
[![D3.js](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fquanting56%2Fmy-stock-map%2Fmain%2Ffrontend%2Fpackage.json&query=%24.dependencies.d3&label=D3.js&logo=d3&color=F9A03C)](https://d3js.org/)
[![TypeScript](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fquanting56%2Fmy-stock-map%2Fmain%2Ffrontend%2Fpackage.json&query=%24.devDependencies.typescript&label=TypeScript&logo=typescript&color=3178C6)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fquanting56%2Fmy-stock-map%2Fmain%2Ffrontend%2Fpackage.json&query=%24.devDependencies.tailwindcss&label=Tailwind%20CSS&logo=tailwindcss&color=06B6D4)](https://tailwindcss.com/)
[![ESLint](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fquanting56%2Fmy-stock-map%2Fmain%2Ffrontend%2Fpackage.json&query=%24.devDependencies.eslint&label=ESLint&logo=eslint&color=4B32C3)](https://eslint.org/)
[![Prettier](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fquanting56%2Fmy-stock-map%2Fmain%2Ffrontend%2Fpackage.json&query=%24.devDependencies.prettier&label=Prettier&logo=prettier&color=F7B93E)](https://prettier.io/)

<!-- backend -->

[![Express](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fquanting56%2Fmy-stock-map%2Fmain%2Fbackend%2Fpackage.json&query=%24.dependencies.express&label=Express&logo=express&logoColor=white)](https://expressjs.com/)
[![better-sqlite3](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fquanting56%2Fmy-stock-map%2Fmain%2Fbackend%2Fpackage.json&query=%24%5B%22dependencies%22%5D%5B%22better-sqlite3%22%5D&label=better-sqlite3&logo=sqlite&color=003B57)](https://github.com/WiseLibs/better-sqlite3)
[![Cheerio](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fquanting56%2Fmy-stock-map%2Fmain%2Fbackend%2Fpackage.json&query=%24.dependencies.cheerio&label=Cheerio&logo=cheerio&color=E88C1F)](https://cheerio.js.org/)
![CORS](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fquanting56%2Fmy-stock-map%2Fmain%2Fbackend%2Fpackage.json&query=%24.dependencies.cors&label=CORS)
![node-fetch](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fquanting56%2Fmy-stock-map%2Fmain%2Fbackend%2Fpackage.json&query=%24%5B%22dependencies%22%5D%5B%22node-fetch%22%5D&label=node-fetch&logo=nodedotjs&color=339933)

<!-- repo information -->

![Last Commit](https://img.shields.io/github/last-commit/quanting56/my-stock-map)
<!-- ![Repo Size](https://img.shields.io/github/repo-size/quanting56/my-stock-map)
![Languages](https://img.shields.io/github/languages/count/quanting56/my-stock-map) -->



## 目錄

- [功能概覽（Overview）](#overview)
- [技術堆疊（Technology Stack）](#technology-stack)
- [專案架構（Project Structure）](#project-structure)
- [資料流程簡述（Data Flow）](#data-flow)
- [開發環境快速啟動（Quick Startup）](#quick-startup)
- [程式碼檢查與格式設定（Code Quality）](#code-quality)
- [上傳更新（Git Commit）](#git-commit)
- [資料快取與長期資料（Data Cache & Long-term Data）](#data-cache--long-term-data)
- [共用元件（Common Components）](#common-components)
- [未來規劃（Roadmap）](#roadmap)
- [開發者（Developer）](#developer)



<a id="overview"></a>
## 功能概覽（Overview）

- **Dashboard 儀表板（大總覽）**
  - 持股總市值、今日損益、個人持股近 7 日漲跌幅、現金部位佔比。
  - 各標的持股比重圖、股票近期趨勢圖（支援 `1日` / `5日` / `30日` / `6個月` / `1年` / `5年` / `10年` / `最久` 等 timeframe 切換）。
  - 個人持倉明細、臺股上市公司市值佔比圖。
  - 個人近期投資事件（功能開發中）。

- **Portfolio 持股管理**
  - 個人動產（股票 + 現金）總值、持股總成本、整體報酬率、現金比例。
  - 資產分布圖、個人資產變化圖（支援 `1週` / `1個月` / `1季` / `半年` / `1年` / `5年` / `最久` 等 timeframe 切換）。
  - 個人持股明細（可於此處編輯，將自動計算單檔市值與報酬率）。
  - 目前會將資料存於 `localStorage`，重新整理頁面不會消失。

- **Stock Detail 個股詳細頁**
  - 從自建後端抓取 **TWSE 日線資料**，並提供價格走勢圖，預設公司為「臺灣市值第 1 大公司」。
  - 支援 `7D` / `1M` / `3M` / `1Y` / `3Y` 等 Time Frame 切換。
  - 提供技術指標小卡：`MA(20)` / `MA(50)` / `RSI` / `Vol Avg`。
  - 提供基本面摘要：本益比（PE）、股價淨值比（PB）、殖利率、股本、估算之近四季 EPS。
  - 個人該股持倉摘要：成本、持股數、損益與百分比（功能開發中，目前仍使用模擬資料，尚未串接實際投資組合）。
  - 一鍵搜尋 PTT / Dcard 該股票相關討論。
  - 個人該股持有時間圖（功能開發中）。
  - 顯示相關新聞 / 消息。

- **Backtest 回測**
  - 多檔比較
    - 提供不同個股或 ETF 之滾動報酬率視覺化比較，有 `對數刻度` / `一般刻度` 供選擇。
  - 單檔比較
    - 有「股票代號」、「起迄日期」、「初始資金」、「策略選擇」、「每次投入資金」等參數可設定。
    - 投資策略選項有「**單筆買入**」、「**定期定額**」、「**均線交叉**」、「**RSI 超買超賣**」供選擇。
    - 資產變化走勢圖，及 KPI 數據（區間總報酬率、最大回撤、年化報酬率、勝率）可參考。

- **Reports 報表管理**
  - 自訂報表區間、報表種類（總覽、持倉明細、交易紀錄（功能規劃中）、空白報表）。
  - 顯示上次產生報表標題與時間點、累計產生次數、預設內容、上次運行耗時等小卡。
  - 報表預覽，提供匯出 CSV、JSON、PDF 文件 等功能做匯出選擇。
  - 提供「最近幾筆的匯出紀錄」與「預設報表」供快速輸出。
  - 有「報表匯入」的功能，符合格式的 JSON 檔或 CSV 檔可直接匯入（功能開發中）。

- **Settings 顯示設定**
  - 個人化設定
    - 個人名稱、電子信箱、貨幣單位、顯示位數千分位。
    - 外觀主題（日間模式 / 夜間模式）。
  - 推播通知（功能規劃中）。
  - 匯出 / 匯入設定檔。
  - 登出功能鍵（功能規劃中）。



<a id="technology-stack"></a>
## 技術堆疊（Technology Stack）

### 前端（Frontend）
- [Vue 3](https://vuejs.org/) + [Vite](https://vitejs.dev/)
  - 使用 Vue 3 Composition API 與 Vue SFC（單檔元件）開發，方便內容維護與擴充。
  - 採用 Vite 作為建構工具，啟動快速、熱重載流暢。
  - 使用 [Vue DevTools](https://devtools.vuejs.org/) 套件作為開發輔助工具。

- [Pinia](https://pinia.vuejs.org/) - store 狀態管理。

- [D3.js](https://d3js.org/) - 用於繪製資料視覺化圖表。

- [Tailwind CSS](https://tailwindcss.com/)
  - 使用 Utility Class 設定樣式與佈局。
  - 實作 RWD 響應式設計，手機、平板、桌機皆可順暢瀏覽。

- [jsPDF](https://artskydj.github.io/jsPDF/docs/jsPDF.html) - 直接透過前端匯出 PDF 文件。

- [TypeScript](https://www.typescriptlang.org/) - 使用 TypeScript 撰寫程式碼，開發時獲得靜態型別檢查與更完整的 IDE 提示，降低重構成本。


### 後端（Backend）
- [Node.js](https://nodejs.org/zh-tw) + [Express.js](https://expressjs.com/)

- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - 本地 SQLite 快取。

- [node-fetch](https://github.com/node-fetch/node-fetch) - 呼叫外部 API。

- [cheerio](https://cheerio.js.org/) - 解析 TAIFEX / TWSE HTML 表格。

- [iconv-lite](https://github.com/ashtuchkin/iconv-lite) - 將 Big5 頁面轉 UTF-8。


### 部署（Deployment）

- 專案部署於 [Railway](https://railway.com/)。
- Railway 部署時會先建置前端，再由 Node.js／Express 後端同時提供 API 與 `frontend/dist/` 的靜態檔案；SQLite 與 JSON 則用於伺服器端資料快取。
- Demo 首次開啟可能因平台閒置機制而有短暫延遲，之後會因 SQLite / JSON 快取加速。

  > Live Demo: **[My Stock Map](https://my-stock-map-production.up.railway.app/)**
  <!-- （Hobby plan, always-on） -->

  ---

- 亦另外手動部署於 GitHub Pages ，作為 Railway 站故障時前端上架測試用（未提供後端服務，資料僅為模擬資料（mock data））。

  > GitHub Pages Demo: **[My Stock Map (gh-p)](https://quanting56.github.io/my-stock-map/)**


### 資料來源（Data Sources）

- **TWSE 證交所**
  - `STOCK_DAY`：日線歷史股價。
    (`https://www.twse.com.tw/exchangeReport/STOCK_DAY`)

  - `BWIBBU`：單檔本益比 / 股價淨值比 / 殖利率。
    (`https://www.twse.com.tw/exchangeReport/BWIBBU`)

  - `BWIBBU_d`：某日全市場本益比 / 股價淨值比 / 殖利率清單。
    (`https://www.twse.com.tw/exchangeReport/BWIBBU_d`)

  - `t187ap03_L`：股本（實收資本額）開放資料。
    (`https://openapi.twse.com.tw/v1/opendata/t187ap03_L`)
    
  - ISIN 上市 / 上櫃清單（HTML，含代碼、名稱、產業）。
    (`https://isin.twse.com.tw/isin/C_public.jsp?strMode=2`)（上市）  
    (`https://isin.twse.com.tw/isin/C_public.jsp?strMode=4`)（上櫃）

- **FinMind TaiwanStockInfo**（代碼/名稱/產業/上市別，作為 ISIN 備援來源）  
  (`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockInfo`)

- **TAIFEX 期交所**（台指 / 櫃買成分股、市值權重）  
  - 台指成分股比重：`https://www.taifex.com.tw/cht/9/futuresQADetail`

  - 櫃買成分股比重：`https://www.bq888.taifex.com.tw/cht/2/tPEXPropertion`

- **新聞來源**
  - [GDELT Doc API](https://www.gdeltproject.org/)：依股票名稱/代碼搜尋近期新聞標題
  - [Google News RSS](https://news.google.com/)：作為 GDELT 失敗時的備援新聞來源



<a id="project-structure"></a>
## 專案架構（Project Structure）

```text
my-stock-map/
 |
 ├─frontend/
 │  ├─ public/        ← 不經 Vite 處理、直接複製到建置輸出的靜態資源
 │  ├─ src/           ← 前端主要原始碼，包含頁面、元件、狀態管理、API、型別與工具函式
 │  │   ├─ pages/          ← 主要的 6 個頁面 
 │  │   │   ├─ Dashboard.vue    ← 總覽 dashboard
 │  │   │   ├─ Portfolio.vue    ← 個人資產分布頁
 │  │   │   ├─ StockDetail.vue  ← 個股詳情頁
 │  │   │   ├─ Backtest.vue     ← 回測頁
 │  │   │   ├─ Reports.vue      ← 報表管理頁
 │  │   │   └─ Settings.vue     ← 個人化設定頁
 │  │   │
 │  │   ├─ components/     ← 各頁面與全站共用的 Vue 元件
 │  │   ├─ store/          ← Pinia stores，管理全站狀態與瀏覽器端資料
 │  │   ├─ api/            ← 前端 API 存取
 │  │   ├─ assets/         ← 由前端程式匯入並交由 Vite 處理的靜態資源
 │  │   ├─ constants/      ← 跨元件共用的常數與固定設定
 │  │   ├─ data/           ← 前端使用的資料檔案
 │  │   │   └─ mock/            ← 開發及無後端環境使用的模擬資料
 │  │   ├─ types/          ← 跨檔案共用的 TypeScript 型別與介面
 │  │   └─ utils/          ← 可重用的資料轉換、格式化與純工具函式
 │  ├─ ...            ← 前端建置、TypeScript、ESLint 與 Prettier 設定檔
 │  └─ package.json
 ├─backend/
 │  ├─ data/          ← 本機 SQLite 與 JSON 執行期快取
 │  ├─ index.js       ← 主伺服器，後端入口
 │  ├─ fundamentalDetails.js
 │  ├─ rankings.js
 │  ├─ symbolMap.js
 │  └─ package.json
 ├─ .vscode/
 ├─ .gitignore
 └─ README.md
```


### Frontend (Vite + Vue 3)

<details>
<summary>查看完整前端目錄</summary>

```text
my-stock-map/
 |
 ├─frontend/
    │ 
┌───┘
├─ public/              ← 靜態資料（如 favicon）
├─ src/
│   │
│   ├─ pages/        ← 主要的 6 個頁面 
│   │   ├─ Dashboard.vue     ← 總覽 / 持股分布 / 持倉明細 / 大盤市值佔比
│   │   ├─ Portfolio.vue     ← 資產分布 / 資產變化圖 / 持股明細
│   │   ├─ StockDetail.vue   ← 個股詳情 / 價格走勢 / 基本面 / 新聞
│   │   ├─ Backtest.vue      ← 多檔回測 / 單檔回測
│   │   ├─ Reports.vue       ← 報表管理
│   │   └─ Settings.vue      ← 個人化設定
│   │
│   ├─ components/   ← 主要 6 頁面的元件
│   │   ├─ Common/
│   │   │   ├─ EditHoldingModal.vue   ← 編輯持股明細的表格視窗（增、刪、調整持股用）
│   │   │   ├─ Footer.vue             ← 頁尾 Footer
│   │   │   ├─ HeaderBar.vue          ← 頂部導覽列 + 股票搜尋列 + 登入按鈕
│   │   │   ├─ LoadingModal.vue       ← 全螢幕 Loading 覆蓋層（資料載入時顯示）
│   │   │   ├─ LogInPage.vue          ← 登入對話框（Email / 密碼）
│   │   │   ├─ MyStockMapLogo.vue     ← My Stock Map 的 Logo 元件檔
│   │   │   ├─ SideBarMenu.vue        ← 側邊選單（切換頁面用）
│   │   │   └─ WelcomeModal.vue       ← 歡迎視窗（進入網站時顯示）
│   │   ├─ Dashboard/
│   │   │   ├─ HoldingDetails.vue              ← 持倉明細表格（Dashboard 版本）
│   │   │   ├─ MarketCapitalizationTreemap.vue ← 台股大盤市值佔比 Treemap 圖
│   │   │   ├─ PerformanceChart.vue            ← 目前選定標的的歷史走勢折線圖
│   │   │   ├─ ShareholdingRatioChart.vue      ← 持股分布甜甜圈圖（Dashboard 版本）
│   │   │   ├─ SummaryCards.vue                ← Summary 卡片（Dashboard 版本）
│   │   │   └─ TimelineList.vue                ← 最近投資事件列表
│   │   ├─ Portfolio/
│   │   │   ├─ HoldingDetails.vue           ← 持股明細表格（Portfolio 版本）
│   │   │   ├─ PersonalAssetsChart.vue      ← 個人總資產變化折線圖
│   │   │   ├─ ShareholdingRatioChart.vue   ← 資產分布甜甜圈圖（Portfolio 版本）
│   │   │   └─ SummaryCards.vue             ← Summary 卡片（Portfolio 版本）
│   │   ├─ StockDetail/
│   │   │   ├─ PriceChartCard/
│   │   │   │   └─ IndicatorSummaryCards.vue ← 技術指標小卡（MA20 / MA50 / RSI / 均量）
│   │   │   ├─ HoldingTimelineChart.vue      ← 個人持有股數隨時間變化圖
│   │   │   ├─ InformationSummary.vue        ← 基本面摘要 + 個人持倉摘要 + 外部論壇討論連結
│   │   │   ├─ PriceChartCard.vue            ← 個股價格走勢圖
│   │   │   └─ RelevantNews.vue              ← 相關新聞列表
│   │   ├─ Backtest/
│   │   │   ├─ SingleAssetBacktest/
│   │   │   │   └─ SingleAssetBacktestChart.vue ← 單檔回測資產淨值折線圖 + KPI 摘要小面板
│   │   │   ├─ RollingReturnTest.vue             ← 多檔回測的滾動報酬率比較
│   │   │   └─ SingleAssetBacktest.vue          ← 單檔回測參數表單 + 策略選擇 + KPI 計算
│   │   ├─ Reports/
│   │   │   ├─ ExportAndPresetLists.vue ← 最近匯出列表 + 預設報表任務清單
│   │   │   ├─ HeaderAndControls.vue    ← 報表管理頁標題 + 日期區間 / 模板選擇表單
│   │   │   ├─ ReportImport.vue         ← 報表匯入區
│   │   │   ├─ ReportPreview.vue        ← 報表預覽區
│   │   │   └─ SummaryCards.vue         ← Summary 卡片（Reports 版本）
│   │   ├─ Settings/    ← 暫時沒有拆分
│   │   └─ Demo/        ← 設計基礎 UI/UX 時的 legacy
│   │
│   ├─ store/
│   │   ├─ displayFormat.ts   ← 貨幣 / 百分比格式化（UI 顯示設定用）
│   │   ├─ personalAssets.ts  ← 使用者個人每日資產紀錄
│   │   ├─ portfolio.ts       ← 持股資料 + localStorage
│   │   ├─ queryStock.ts      ← 全站目前查詢的 symbol（目前選中的股票代碼）
│   │   ├─ settingItems.ts    ← 一般設定（顯示名稱 / Email / 貨幣單位 / 通知偏好）
│   │   ├─ theme.ts           ← 深淺色主題（Tailwind dark mode 切換）
│   │   └─ uiState.ts         ← 頁籤 / 主頁面切換
│   │
│   ├─ api/
│   │   ├─ personalAssets.ts  ← 讀取或寫入個人每日資產紀錄（目前暫串 localStorage）
│   │   └─ stocksApi.ts       ← 與本地後端溝通的股票 API 工具（股價序列正規化 / 公司清單 / 基本面 / 新聞 + 前端快取）
│   │
│   ├─ assets/
│   │   └─ vue.svg
│   │
│   ├─ constants/
│   │   └─ bankColors.ts      ← 設定圖表裡各家銀行的顏色呈現
│   │
│   ├─ data/
│   │   └─ mock/
│   │       ├─ assetsMockData.json      ← 個人總資產歷史假資料（活存餘額 + 每日持股市值）
│   │       ├─ marketCapitalizationTreemapData.js  ← 台股大盤市值佔比 Treemap 用假資料
│   │       ├─ mockData0050.js          ← 0050 歷史 OHLC 假資料
│   │       ├─ mockData2330.js          ← 2330 歷史 OHLC 假資料
│   │       ├─ mockData2412.js          ← 2412 歷史 OHLC 假資料
│   │       ├─ mockData2881.js          ← 2881 歷史 OHLC 假資料
│   │       ├─ mockDataCompanyName.json ← 台股代號與公司名稱對應清單假資料
│   │       └─ portfolioData.ts         ← 預設投資組合假資料（持股明細）
│   │
│   ├─ types/
│   │   └─ personalAssets.ts      ← 個人每日資產資料格式
│   │
│   ├─ utils/
│   │   ├─ portfolio/
│   │   │   └─ personalAssets.ts   ← 個人每日資產資料格式轉換
│   │   ├─ dateNormalize.ts        ← 日期格式轉換
│   │   └─ numberNormalize.ts      ← 數字格式（型別）轉換
│   │
│   ├─ App.vue     ← Root 佈局：Header / 側邊選單 / 主內容 + data-theme 深淺色容器
│   ├─ main.ts     ← Vue 進入點：建立 App、掛載 Pinia、載入全域樣式並掛載到 #app
│   └─ style.css   ← Tailwind 入口 + 自訂 light/dark 主題 + 自訂 UI utility 類別
├─ .prettierignore      ← Prettier 檢查時忽略的檔案與資料夾
├─ eslint.config.mjs    ← ESLint Flat Config 設定，負責 Vue、TypeScript、JavaScript 與 Prettier 提示檢查
├─ index.html
├─ package-lock.json
├─ package.json         ← 專案資訊、scripts、dependencies/devDependencies
├─ prettier.config.mjs  ← Prettier 格式設定，包含縮排、引號、分號、行寬與 Tailwind class 排序規則
├─ tsconfig.json        ← 前端 TypeScript 設定
├─ tsconfig.node.json   ← Node/Vite 的 TypeScript 設定
├─ vite-env.d.ts        ← Vite 型別宣告入口
└─ vite.config.ts       ← Vite 設定（alias、proxy、base、plugins）
```

</details>


### Backend (Node.js + Express.js + SQLite)

<details>
<summary>查看完整後端目錄</summary>

```text
my-stock-map/
 |
 ├─backend/
    │ 
┌───┘
├─ data/
│   ├─ .gitkeep          ← 保留空的 data/ 目錄；SQLite 與 JSON 快取檔不納入 Git
│   ├─ stocks.db         ← 執行後產生的 SQLite 股價快取資料庫（stock_prices 日 K 表）
│   ├─ symbols.json      ← symbolMap.js 執行後產生的股票代號 / 名稱 / 上市別 / 產業 快取
│   └─ market_ranks.json ← rankings.js 執行後產生的上市／上櫃市值排名快取
├─ index.js              ← 主伺服器：建立 stocks.db 股價表，提供 /api/stocks + /api/news，並掛載 symbols / rankings / fundamentals 路由
├─ fundamentalDetails.js ← 向 TWSE 取單檔/全市場基本面 + 股本，結合 DB 最新收盤估算 EPS，提供 /api/fundamentals/:code
├─ rankings.js           ← 抓 TAIFEX 權重表整理成市值排名，快取於 market_ranks.json 並提供 /api/market-ranks* API
├─ symbolMap.js          ← 抓 TWSE ISIN / FinMind 產生 symbols.json，並提供 /api/symbols* 代號/名稱查詢 API
├─ package-lock.json
└─ package.json          ← 專案資訊、scripts、dependencies/devDependencies
```

</details>



<a id="data-flow"></a>
## 資料流程簡述（Data Flow）

1. 前端（例如 `PriceChartCard.vue`）呼叫 `api/stocksApi.ts` 中的 `fetchStockSeries(symbol, params)` 函式。

2. `api/stocksApi.ts` 將請求轉發到後端 `GET /api/stocks/:symbol`。

3. 後端：

    - 檢查 `stocks.db` 是否已有該月份資料。

    - 若無 → 打 TWSE `STOCK_DAY` API 抓指定月份，寫入 SQLite。

    - 未來同一檔、同一範圍就直接從 SQLite 回傳，不再打 TWSE。

4. `fetchStockSeries()` 內部把後端回傳的原始 JSON 正規化成 `StockBar[]`（日期→`Date`，數字→`number`），用 D3.js 畫圖。

5. 基本面 `GET /api/fundamentals/:code` 同理，後端負責打 TWSE & open data，前端只拿整理好的結果。

6. 新聞 `GET /api/news/:code` 優先嘗試 GDELT → 失敗再用 Google News RSS，前端只渲染結果。

<!-- 個人每日資產資料後端架設後，需補其資料流程敘述 -->



<a id="quick-startup"></a>
## 開發環境快速啟動（Quick Startup）

以下指令假設已經安裝好 Node.js 和 npm。

> 註：目前前端與後端依賴分別在其資料夾裡的 `package.json` 中，因此要從專案根目錄分別進到 `frontend/` 和 `backend/` 再分別執行 `npm install`。

> 這個 repo 的目錄結構是：

```text
my-stock-map/
┌┘
├─ .vscode/             ← VS Code 工作區設定，統一編輯器檢查與擴充套件建議
│   ├─ extensions.json  ← 建議安裝的 VS Code 擴充套件清單
│   └─ settings.json    ← 專案層級的 VS Code 設定，例如 ESLint、Prettier、Tailwind 提示與關閉自動格式化
├─ backend/             ← 後端伺服器
│   ├─ data/            ← 後端產生的 data
│   ├─ index.js
│   ├─ ...
│   └─ package.json     ← 後端 npm 專案設定、套件依賴、指令
├─ frontend/
│   ├─ src/             ← 前端 Vue 內容
│   ├─ ...
│   └─ package.json     ← 前端 npm 專案設定、套件依賴、指令
├─ .gitignore
└─ README.md
```

1. Clone 專案
    ```bash
    git clone https://github.com/quanting56/my-stock-map.git
    cd my-stock-map
    ```

> 建議接下來「開兩個終端視窗」：一個跑後端，一個跑前端。

2. 分別安裝前端與後端依賴（於 `frontend/` 和 `backend/` 分別操作）

    ```bash
    # 後端終端機操作

    cd backend
    npm install
    ```

    ```bash
    # 前端終端機操作

    cd frontend
    npm install
    ```

3. 啟動後端（Express + SQLite，在 `backend/` 目錄啟動後端）
    ```bash
    # 後端終端機操作

    npm run dev
    # 開發環境中，後端伺服器預設跑在 http://localhost:3000
    # 部署於 Railway 時，實際會使用平台提供的 PORT（目前為 8080）
    ```

4. 啟動前端（Vite Dev Server，在 `frontend/` 目錄啟動前端）
    ```bash
    # 前端終端機操作

    npm run dev
    # 預設跑在 http://localhost:5173
    ```

開發環境中，前端以 `/api/*` 相對路徑送出請求，再由 Vite Dev Server 的 proxy 轉發至 `http://localhost:3000` 的後端服務。



<a id="code-quality"></a>
## 程式碼檢查與格式設定（Code Quality）

> 目前以下程式碼品質檢查套用於 `frontend/`。後端仍使用 JavaScript，預計於後續 TypeScript 化時加入獨立的 ESLint、Prettier 與 TypeScript 設定。

本專案使用 **ESLint**、**Prettier**、**Vue ESLint plugin**、**TypeScript ESLint** 與 **Tailwind CSS IntelliSense** 輔助前端開發。

目前設定目標是：

- 由 VS Code 顯示 ESLint / Prettier / Tailwind 提示。
- 存檔時不自動格式化、不自動修正 ESLint。
- 由開發者依照提示手動調整程式碼。
- Tailwind class 依官方建議順序檢查。

常用指令：

```bash
cd frontend

# TypeScript 型別檢查
npm run type-check

# ESLint 檢查 Vue / TypeScript / JavaScript
npm run lint

# 嚴格檢查：warning 也會視為不通過
npm run lint:strict

# Prettier 格式檢查，不會自動修改檔案
npm run format:check

# 綜合檢查
npm run check

# 嚴格綜合檢查
npm run check:strict
```

> 本專案刻意沒有設定 `eslint --fix` 或 `prettier --write` 的 npm script，避免誤觸後大量自動修改程式碼。



<a id="git-commit"></a>
## 上傳更新（Git Commit）

> Railway 會在每次 push 後自動觸發部署，無須另外手動 build。

> 步驟 1-3 暫時僅於前端程式碼異動時使用，並需先執行 `cd frontend` 以進入 `frontend/`。

1. 進行 TypeScript 型別檢查
    ```bash
    npm run type-check
    ```

2. 檢查 Prettier 支援的檔案格式
    ```bash
    npm run format:check
    ```

3. 檢查 ESLint / Vue / TypeScript / Prettier 提示
    ```bash
    npm run lint
    ```

4. 放入暫存檔
    ```bash
    # 先回到 repo 根目錄
    cd ..
    
    # 確認此次修改
    git status

    # 將此次修改移入暫存區 Staging Area
    git add <本次修改的檔案或目錄>
    ```

5. 提交 commit（本專案使用 Conventional Commits 風格）
    ```bash
    # 按照分類提交 commit
    git commit -m "分類(範圍): 此次修改內容"
    ```

    - **Git Commit 分類（Git Commit Message）**

        |類型	|用途說明                |
        |------|-----------------------|
        |`feat`|💡 新增功能（feature）   |
        |`fix` |🐛 修復錯誤（bug）       |
        |`docs`|📚 修改文件（README、說明文字、註解等）|
        |`perf`|🚀 性能優化             |
        |`refactor`|🔧 重構程式碼（邏輯不變，非 bug fix 或新功能）|
        |`style`|🎨 調整程式碼格式（例如空格、縮排、換行，不影響功能）|
        |`test`|✅ 增加或修改測試內容     |
        |`build`|🏗️ 編譯相關檔案變動，如 Vite 設定或打包流程|
        |`revert`|⏪ 撤銷回復先前的commit|
        |`chore`|🔨 其他雜項（部署設定、更新套件、CI 設定、建置腳本等）|

6. 上傳到 GitHub Repo
    ```bash
    git push
    ```


### 若是要另外部署至 GitHub Pages：

> 步驟 7-8 請於 `frontend/` 執行指令。

7. 進行打包
    ```bash
    npm run build
    ```

8. 部署到 GitHub Pages
    ```bash
    npx gh-pages -d dist
    ```

> 註：GitHub Pages 為靜態網站（不提供後端服務），僅作為前端 demo 用（將使用模擬資料（mock data））。



<a id="data-cache--long-term-data"></a>
## 資料快取與長期資料（Data Cache & Long-term Data）

> 注意：`backend/data/` 為後端快取（部署環境可透過 `DATA_DIR` 環境變數指定其他儲存位置，例如 Railway Volume）；`frontend/src/data/mock/` 則為前端 mock 資料。

- **股價快取 SQLite**
    - 檔案路徑：`backend/data/stocks.db`
    - 已完整快取的歷史月份會直接從 SQLite 讀取；若缺少指定月份，或當月資料仍需更新，才會再次呼叫 TWSE API。

- **代號 / 公司名稱快取**
    - 檔案路徑：`backend/data/symbols.json`
    - 來源：TWSE ISIN 頁面 → 若失敗就改用 FinMind。

- **市值排名快取**
    - 檔案路徑：`backend/data/market_ranks.json`
    - 來源：TAIFEX 頁面，解析表格後搭配 `symbols.json` 對上代碼。

- **個人持股資料**
    - 儲存在瀏覽器 `localStorage`（key：`myStockMap_holdings`，由 `portfolio.ts` store 管理）。



<a id="common-components"></a>
## 共用元件（Common Components）

> 這些元件路徑皆以 `frontend/src/` 為基準，會出現在不同頁面中，可重複利用。

- `components/Common/HeaderBar.vue`
    - 全站頂部導覽列：顯示 My Stock Map Logo、提供股票搜尋框（支援「/」快捷鍵聚焦）、登入按鈕與深淺色主題切換。

- `components/Common/SideBarMenu.vue`
    - 左側功能選單：依據 `uiState.ts` store 的 `tabs` 資訊產生按鈕，並用來切換 **Dashboard** / **Portfolio** / **StockDetail** / **Backtest** / **Reports** / **Settings** 等主要頁面。

- `components/Common/Footer.vue`
    - 頁尾區塊：顯示 Logo 與專案標語、贊助連結群組、作者聯絡 Email 與版權 / 免責說明文字。

- `components/Common/EditHoldingModal.vue`
    - 編輯持股資料的彈出視窗：以表格方式一次調整多檔持股（代碼、名稱、股數、現價、成本），支援新增 / 刪除列，儲存時會更新 `portfolioStore.holdingDetailsData` 並呼叫 `portfolioStore.recalcValues()`，實際的持股資料持久化則由 `portfolio.ts` store 統一寫入 `localStorage`。

- `components/Common/LoadingModal.vue`
    - 全螢幕 Loading 遮罩（使用 `<Teleport>` 掛到 `<body>`）：顯示轉圈圈與自訂訊息，用於資料載入中的全局提示。
    - 可在使用元件時，透過 `props` 的方式將自訂文字傳進子元件顯示在文字部分。

- `components/Common/LogInPage.vue`
    - 全螢幕登入對話框遮罩（使用 `<Teleport>` 掛到 `<body>`）：
        - Email / 密碼輸入欄位。
        - 點擊背景或按 Esc 可關閉。
    - 目前登入行為為暫時的 `alert("登入功能建置中")`，之後將接後端認證。

- `components/Common/MyStockMapLogo.vue`
    - 專案 Logo 的 SVG 元件：將 `<svg>` 元件化，提供給 Header、Footer 等處重複使用，未來若要改 Logo 只需改這一處（網站 Favicon 需另外到 `public/` 中修改）。

- `components/Common/WelcomeModal.vue`
    - 全螢幕歡迎視窗（使用 `<Teleport>` 掛到 `<body>`）：進入網站時會看到的招呼語與介紹文字。
    - 使用者若登入且設定個人顯示名字，將會在此處個人化顯示（功能開發中）。



<a id="roadmap"></a>
## 未來規劃（Roadmap）

### 現正進行中

- 將專案 `frontend/` 整個 TypeScript 化，方便後續開發與維護。

- 新增 `personalAssets` 的編輯 Modal 介面。

- 確認 `frontend/src/store/settingItems.ts` 和 `frontend/src/store/displayFormat.ts` 有沒有項目（例如貨幣單位）要合併，並確認與 `frontend/src/pages/Settings` 的項目是否有相符。

- 針對手機或平板使用者做 UI/UX 優化。

- 把 Dashboard 裡 Treemap（`frontend/src/components/Dashboard/MarketCapitalizationTreemap.vue`）的錯誤處理邏輯（後端掛掉會改用模擬資料（mock data））部分移到 `frontend/src/api/stocksApi.ts` ，或是新建 Pinia 來統一全站的錯誤管理。

- Dashboard 股票趨勢圖，新增可以多檔並列，並讓使用者自訂顯示檔數。

- 完成 `frontend/src/components/StockDetail/HoldingTimelineChart.vue` 的持有時間軸（依實際交易紀錄畫線）。

- 完成 Footer 的超連結與其頁面。

- 統一按鈕樣式。

- 改善 Stock Detail 頁面「價格走勢圖」的 tooltip 互動效果。

- Portfolio 「個人資產變化趨勢圖」加上現金佔比圖。

- Backtest 加入是否開啟「通膨修正」選項。

- 重新調整整體網站配色。

- Dashboard 頁面的大盤市值佔比圖加上上櫃公司，使其能夠在上市公司與上櫃公司間做切換。

- Portfolio 加上個人資產 `週K` / `月K` / `季K` / `年K` 的 [Candlestick Chart](https://observablehq.com/@d3/candlestick-chart/2) 區域。

- 調整 Dashboard 區塊，將 `SummaryCards` 區域的「持股總市值」和「今日損益」放到 `持倉明細` 區域，原處改為最新加權指數與最新加權損益。

- 新增 Dashboard 大盤市值佔比圖焦點功能，當點擊 Dashboard 頁面其他含股票內容時，佔比圖中對應公司會自動高亮（若存在的話）。


### 近期規劃中

- Portfolio 與 Stock Detail 串接實際持股成本，而不是 mock 值。
  - 需要先決定「交易紀錄」資料結構（ex: `[{date, id, action, qty, price}]`），
  - 再在前端或後端計算成交加總 & 現有持股。

- 調整 Dashboard 頁面小卡資料串接。

- 調整 Portfolio 頁面小卡資料串接。

- 完成 Reports 頁面中，報表匯入按鈕功能（模板編輯器遮罩）。

- 將專案 `backend/` 整個 TypeScript 化，方便後續開發與維護。

- 將 `frontend/src/api/stocksApi.ts` 按領域拆檔以方便維護（可在後端 TS 化後再著手進行）。

- 串連即時股價 API。

- 將 News 來源白名單設定改為可調整的狀態（加在 Settings 頁面），讓使用者可以自由選擇。

- Stock Detail 頁面「個人持倉快速摘要」資料串接。

- Stock Detail 頁面新增滾動最大回撤圖表。

- 新增「槓桿模擬」功能，參考 testfol.io 的 `L`、`E`、`SW`、`SP` 參數設計：
  - 以原始標的 + 槓桿倍率 `L` + 費用率 `E` + swap 比例 `SW` + 利率點差 `SP` 生成虛擬槓桿資產。
  - 設計支援類似 `2330SIM?L=2&E=0.95` 這種語法，對個股 / 指數做槓桿回測。

- 為仍在規劃中的指數 / ETF 設計「模擬資產代碼（SIM）」格式，類似 testfol.io 的 `SPYSIM` / `QQQSIM` 方法：
  - 例：`0050SIM`、`TWII_SIM`，用歷史成分股 + 權重來回推上市前的走勢。

- 新增美股數據 / 資料。

- 將大盤公司依產業等類別及其子類別，照市值畫成 [Sequences Sunburst](https://observablehq.com/@kerryrodden/sequences-sunburst)。

- 在 Welcome Modal 上面增加文字雲 [Word Cloud](https://observablehq.com/@d3/word-cloud)。

- 按照公司市值、產業市值、年份繪出 [Animated Treemap](https://observablehq.com/@d3/animated-treemap)。

- 製作 Idle Modal。


### 中長期規劃

- 改善後端程式碼架構，將 `backend/index.js` 依功能拆分。

- 完成 **登入** / **登出** 功能。
  - 需要補的一些知識：
    - Node.js + Express.js
    - 密碼雜湊（bcrypt）
    - Session 或 JWT
    - 基本的「註冊 / 登入 / 驗證 middleware」

- 與其他使用者的投資競賽（目前投資報酬率相較於整個專案使用者裡之排名）。
  - 需要補的一些知識：
    - SQLite + Node.js
  - 需要處理：
    - 使用者資料表 server-side data。
    - 每個 user 的 portfolio / 交易紀錄。
    - 定期計算報酬率並排行。

- 推播功能（預計於 App 化後進行）
  - 需要補的一些知識：
    - PWA 基礎。
    - Swift / Kotlin / Flutter / React Native。

- Stock Detail 中做「估值 / 殖利率 軌跡圖」
  - 使用工具
    - 連結散點圖 [Connected Scatterplot](https://observablehq.com/@d3/connected-scatterplot/2)
  - 內容
    - x 軸：股價淨值比 (P/B) 或 本益比 (P/E)
    - y 軸：殖利率 (Dividend Yield)
    - 每一個點：某個月 或 某年



<a id="developer"></a>
## 開發者（Developer）
本案由 [quanting56](https://github.com/quanting56) 開發與維護。

<!-- 若你有任何建議或想法，歡迎開 Issue 或 PR，一起把這個「投資可視化系統」專案變得更好！ -->

> README.md 更新時間：2026/08/03 23:18
