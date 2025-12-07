# My Stock Map / 投資可視化系統

一個開發來為使用者 **個人記帳**、**長期投資管理用** 的「**個人投資可視化系統**」專案，專門拿來快速管理自己的持股（目前以臺股為主）、資產配置，並檢視持股股價走勢、基本面摘要與新聞訊息，以及回測投資策略。
前端使用 **Vue 3 + Vite + Pinia + D3.js + TailwindCSS**，後端使用 **Node.js + Express + SQLite 快取股價與基本面**。

> ⚠️ **免責聲明**：本專案僅供個人學習與技術實驗使用，所有資料與分析結果都不構成任何投資建議，投資前請衡量自身風險承受能力。



## 功能概覽（Overview）

- **Dashboard 儀表板（大總覽）**
  - 持股總市值、今日損益、個人持股近 7 日漲跌幅、現金部位佔比。
  - 各標的持股比重圖、股票近期趨勢圖（支援 `1日` / `5日` / `30日` / `6個月` / `1年` / `5年` / `10年` / `最久` 等 Time Frame 切換）。
  - 個人持倉明細、臺股上市公司市值佔比圖。
  - ~~個人近期投資事件~~（功能開發中）。

- **Portfolio 持股管理**
  - 個人動產（股票 + 現金）總值、持股總成本、整體報酬率、現金比例。
  - 資產分布圖、個人資產變化圖（支援 `1週` / `1個月` / `1季` / `半年` / `1年` / `5年` / `最久` 等 Time Frame 切換）。
  - 個人持股明細（可於此處編輯，將自動計算單檔市值與報酬率）。
  - 目前會將資料存於 `localStorage`，重新整理頁面不會消失。

- **Stock Detail 個股詳細頁**
  - 從自建後端抓取 **TWSE 日線資料**，並提供價格走勢圖，預設公司為「臺灣市值第 1 大公司」。
  - 支援 `7D` / `1M` / `3M` / `1Y` / `3Y` 等 Time Frame 切換。
  - 提供技術指標小卡：`MA(20)` / `MA(50)` / `RSI` / `Vol Avg`。
  - 提供基本面摘要：本益比（PE）、股價淨值比（PB）、殖利率、股本、估算之近四季 EPS。
  - 個人該股持倉摘要：成本、持股數、損益與百分比。
  - 一鍵搜尋 PTT / Dcard 該股票相關討論。
  - ~~個人該股持有時間圖~~（功能開發中）。
  - 顯示相關新聞 / 消息。

- **Backtest 回測**
  - 多檔比較
    - 提供不同個股或 ETF 之滾動報酬率視覺化比較，有 `對數刻度` / `一般刻度` 供選擇。
  - 單檔比較
    - 有「股票代號」、「起迄日期」、「初始資金」、「策略選擇」、「每次投入資金」等參數可設定。
    - 投資策略選項有「**單筆買入**」、「**定期定額**」、「**均線交叉**」、「**RSI 超買超賣**」供選擇。
    - 資產變化走勢圖，及 KPI 數據（區間總報酬率、最大回撤、年化報酬率、勝率）可參考。

- **Reports 報表管理**
  - 自訂報表區間、報表種類（總覽、持倉明細、~~交易紀錄~~、空白報表）。
  - 顯示上次產生報表標題與時間點、累計產生次數、預設內容、上次運行耗時等小卡。
  - 報表預覽，提供匯出 CSV、JSON、PDF 文件 等功能做匯出選擇。
  - 提供「最近幾筆的匯出紀錄」與「預設報表」供快速輸出。
  - 有「報表匯入」的功能，符合格式的 JSON 檔或 CSV 檔可直接匯入。

- **Settings 顯示設定**
  - 個人化設定
    - 個人名稱、電子信箱、貨幣單位、顯示位數千分位。
    - 外觀主題（日間模式 / 夜間模式）。
  - ~~推播通知~~（功能開發中）。
  - 匯出 / 匯入設定檔。
  - ~~登出功能鍵~~（功能開發中）。



## 技術堆疊（Technology Stack）

### Front-end
- [Vue 3](https://vuejs.org/) + [Vite](https://vitejs.dev/)
  - 使用 Vue 3 Composition API 與 Vue SFC（單檔元件）開發，方便內容維護與擴充。
  - 採用 Vite 作為建構工具，啟動快速、熱重載流暢。

- [Pinia](https://pinia.vuejs.org/) - Store 狀態管理。

- [D3.js](https://d3js.org/) - 用於繪製資料視覺化圖表。

- [Tailwind CSS](https://tailwindcss.com/)
  - 使用 Utility Class 設定樣式與佈局。
  - 實作 RWD 響應式設計，手機、平板、桌機皆可順暢瀏覽。

- [jsPDF](https://artskydj.github.io/jsPDF/docs/jsPDF.html) - 直接透過前端匯出 PDF 文件。


### Back-end
- [Node.js](https://nodejs.org/zh-tw) + [Express.js](https://expressjs.com/)

- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - 本地 SQLite 快取。

- [node-fetch](https://github.com/node-fetch/node-fetch) - 呼叫外部 API。

- [cheerio](https://cheerio.js.org/) - 解析 TAIFEX / TWSE HTML 表格。

- [iconv-lite](https://github.com/ashtuchkin/iconv-lite) - 將 Big5 頁面轉 UTF-8。


### Data Sources（使用公開資料）

- **TWSE 證交所**
  - `STOCK_DAY`：日線歷史股價。
    (`https://www.twse.com.tw/exchangeReport/STOCK_DAY`)

  - `BWIBBU`：單檔本益比 / 股價淨值比 / 殖利率。
    (`https://www.twse.com.tw/exchangeReport/BWIBBU`)

  - `BWIBBU_d`：某日全市場本益比 / 股價淨值比 / 殖利率清單。
    (`https://www.twse.com.tw/exchangeReport/BWIBBU_d`)

  - `t187ap03_L`：股本（實收資本額） Open Data。
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



## 專案架構（Project Structure）

### Front-end (Vite + Vue 3)
```text
my-stock-map/
 |
 ├─src/
    │ 
┌───┘
│
├─ pages/        ← 主要的 6 個頁面 
│   ├─ Dashboard.vue     ← 總覽 / 持股分布 / 持倉明細 / 大盤市值佔比
│   ├─ Portfolio.vue     ← 資產分布 / 資產變化圖 / 持股明細
│   ├─ StockDetail.vue   ← 個股詳情 / 價格走勢 / 基本面 / 新聞
│   ├─ Backtest.vue      ← 多檔回測 / 單檔回測
│   ├─ Reports.vue       ← 報表管理
│   └─ Settings.vue      ← 個人化設定
│
├─ components/   ← 主要 6 頁面的元件
│   ├─ Common/
│   │   ├─ EditHoldingModal.vue   ← 編輯持股明細的表格視窗（增、刪、調整持股用）
│   │   ├─ Footer.vue             ← 頁尾 Footer
│   │   ├─ HeaderBar.vue          ← 頂部導覽列 + 股票搜尋列 + 登入按鈕
│   │   ├─ LoadingModal.vue       ← 全螢幕 Loading 覆蓋層（資料載入時顯示）
│   │   ├─ LogInPage.vue          ← 登入對話框（Email / 密碼）
│   │   ├─ MyStockMapLogo.vue     ← My Stock Map 的 Logo 元件檔
│   │   └─ SideBarMenu.vue        ← 側邊選單（切換頁面用）
│   ├─ Dashboard/
│   │   ├─ HoldingDetails.vue              ← 持倉明細表格（Dashboard 版本）
│   │   ├─ MarketCapitalizationTreemap.vue ← 台股大盤市值佔比 Treemap 圖
│   │   ├─ PerformanceChart.vue            ← 目前選定標的的歷史走勢折線圖
│   │   ├─ ShareholdingRatioChart.vue      ← 持股分布甜甜圈圖（Dashboard 版本）
│   │   ├─ SummaryCards.vue                ← Summary 卡片（Dashboard 版本）
│   │   └─ TimelineList.vue                ← 最近投資事件列表
│   ├─ Portfolio/
│   │   ├─ HoldingDetails.vue           ← 持股明細表格（Portfolio 版本）
│   │   ├─ PersonalAssetsChart.vue      ← 個人總資產變化折線圖
│   │   ├─ ShareholdingRatioChart.vue   ← 資產分布甜甜圈圖（Portfolio 版本）
│   │   └─ SummaryCards.vue             ← Summary 卡片（Portfolio 版本）
│   ├─ StockDetail/
│   │   ├─ PriceChartCard/
│   │   │   └─ IndicatorSummaryCards.vue ← 技術指標小卡（MA20 / MA50 / RSI / 均量）
│   │   ├─ HoldingTimelineChart.vue      ← 個人持有股數隨時間變化圖
│   │   ├─ InformationSummary.vue        ← 基本面摘要 + 個人持倉摘要 + 外部論壇討論連結
│   │   ├─ PriceChartCard.vue            ← 個股價格走勢圖
│   │   └─ RelevantNews.vue              ← 相關新聞列表
│   ├─ Backtest/
│   │   ├─ SingleAssetsBacktest/
│   │   │   └─ SingleAssetsBacktestChart.vue ← 單檔回測資產淨值折線圖 + KPI 摘要小面板
│   │   ├─ RollingReturnTest.vue             ← 多檔回測的滾動報酬率比較
│   │   └─ SingleAssetsBacktest.vue          ← 單檔回測參數表單 + 策略選擇 + KPI 計算
│   ├─ Reports/
│   │   ├─ ExportAndPresetLists.vue ← 最近匯出列表 + 預設報表任務清單
│   │   ├─ HeaderAndControls.vue    ← 報表管理頁標題 + 日期區間 / 模板選擇表單
│   │   ├─ ReportImport.vue         ← 報表匯入區
│   │   ├─ ReportPreview.vue        ← 報表預覽區
│   │   └─ SummaryCards.vue         ← Summary 卡片（Reports 版本）
│   └─ Settings/
│
├─ store/
│   ├─ displayFormat.js   ← 貨幣 / 百分比格式化（UI 顯示設定用）
│   ├─ portfolio.js       ← 持股資料 + localStorage
│   ├─ queryStock.js      ← 全站目前查詢的 symbol（目前選中的股票代碼）
│   ├─ settingItems.js    ← 一般設定（顯示名稱 / Email / 貨幣單位 / 通知偏好）
│   ├─ theme.js           ← 深淺色主題（Tailwind dark mode 切換）
│   └─ uiState.js         ← 頁籤 / 主頁面切換
│
├─ api/
│   └─ stocksApi.js   ← 與本地後端溝通的股票 API 工具（股價序列正規化 / 公司清單 / 基本面 / 新聞 + 前端快取）
│
├─ assets/
│   └─ vue.svg
│
├─ data/
│   └─ mock/
│       ├─ assetsMockData.js        ← 個人總資產歷史假資料（活存餘額 + 每日持股市值）
│       ├─ marketCapitalizationTreemapDate.js  ← 台股大盤市值佔比 Treemap 用假資料
│       ├─ mockData0050.js          ← 0050 歷史 OHLC 假資料
│       ├─ mockData2330.js          ← 2330 歷史 OHLC 假資料
│       ├─ mockData2412.js          ← 2412 歷史 OHLC 假資料
│       ├─ mockData2881.js          ← 2881 歷史 OHLC 假資料
│       ├─ mockDataCompanyName.js   ← 台股代號與公司名稱對應清單假資料
│       └─ portfolioData.js         ← 預設投資組合假資料（持股明細）
│
├─ App.vue     ← Root 佈局：Header / 側邊選單 / 主內容 + data-theme 深淺色容器
├─ main.js     ← Vue 進入點：建立 App、掛載 Pinia、載入全域樣式並掛載到 #app
└─ style.css   ← Tailwind 入口 + 自訂 light/dark 主題 + 自訂 UI utility 類別
```

### Back-end (Node.js + Express.js + SQLite)
```text
my-stock-map/
┌┘
│
├─ server/
│   ├─ index.js              ← 主伺服器：建立 stocks.db 股價表，提供 /api/stocks + /api/news，並掛載 symbols / rankings / fundamentals 路由
│   ├─ symbolMap.js          ← 抓 TWSE ISIN / FinMind 產生 symbols.json，並提供 /api/symbols* 代號/名稱查詢 API
│   ├─ rankings.js           ← 抓 TAIFEX 權重表整理成市值排名，快取於 market_ranks.json 並提供 /api/market-ranks* API
│   └─ fundamentalDetails.js ← 向 TWSE 取單檔/全市場基本面 + 股本，結合 DB 最新收盤估算 EPS，提供 /api/fundamentals/:code
└─ data/
    ├─ stocks.db             ← SQLite 股價快取資料庫（stock_prices 日 K 表）
    ├─ symbols.json          ← symbolMap.js 產生的代號 / 名稱 / 上市別 / 產業 快取
    └─ market_ranks.json     ← rankings.js 產生的上市 / 上櫃市值排名快取
```



## 資料流程簡述（Data Flow）

1. 前端（例如 `PriceChartCard.vue`）呼叫 `api/stocksApi.js` 中的 `fetchStockSeries(symbol, params)` 函式。

2. `api/stocksApi.js` 將請求轉發到後端 `/api/stocks/:symbol`。

3. 後端：

    - 檢查 `stocks.db` 是否已有該月份資料。

    - 若無 → 打 TWSE `STOCK_DAY` API 抓指定月份，寫入 SQLite。

    - 未來同一檔、同一範圍就直接從 SQLite 回傳，不再打 TWSE。

4. `fetchStockSeries()` 內部把後端回傳的原始 JSON 正規化成 `StockBar[]`（日期→`Date`，數字→`number`），用 D3.js 畫圖。

5. 基本面 `/api/fundamentals/:code` 同理，後端負責打 TWSE & open data，前端只拿整理好的結果。

6. 新聞 `/api/news/:code` 優先嘗試 GDELT → 失敗再用 Google News RSS，前端只渲染結果。



## 開發環境快速啟動（Quick Startup）

以下指令假設已經安裝好 Node.js 和 npm。
> 這個 repo 的目錄結構是：

```text
my-stock-map/
┌┘
├─ data/            ← 後端產生的data
├─ public/
├─ server/          ← 後端伺服器
│   ├─ index.js
│   └─ ...
├─ src/             ← 前端 Vue 內容
├─ index.html
├─ package-lock.json
├─ package.json
├─ README.md
├─ vite.config.js
└─ ...
```

1. Clone 專案
    ```bash
    git clone https://github.com/quanting56/my-stock-map.git
    cd my-stock-map
    ```

2. 安裝前端依賴（專案根目錄）
    ```bash
    npm install
    ```

3. 安裝後端依賴（server 子資料夾）
    ```bash
    cd server
    npm install
    cd ..
    ```

> 建議接下來「開兩個終端視窗」：一個跑後端，一個跑前端。

4. 啟動後端（Express + SQLite，在專案根目錄啟動 Terminal A）
    ```bash
    node server/index.js
    # 伺服器預設跑在 http://localhost:3000
    ```

5. 啟動前端（Vite Dev Server，在專案根目錄啟動 Terminal B）
    ```bash
    npm run dev
    # 預設跑在 http://localhost:5173
    ```

前端會透過 `http://localhost:3000` 呼叫各種 API（股票、symbols、fundamentals、news）。



## 資料快取與長期資料（Data Cache & Long-term Data）

- **股價快取 SQLite**
    - 檔案路徑：`data/stocks.db`
    - 同一檔股票第二次之後查詢，會直接從 SQLite 讀取，只有缺月份才再打 TWSE API。

- **代號 / 公司名稱快取**
    - 檔案路徑：`data/symbols.json`
    - 來源：TWSE ISIN 頁面 → 若失敗就改用 FinMind。

- **市值排名快取**
    - 檔案路徑：`data/market_ranks.json`
    - 來源：TAIFEX 頁面，解析表格後搭配 `symbols.json` 對上代碼。

- **個人持股資料**
    - 儲存在瀏覽器 `localStorage`（key：`myStockMap_holdings`，由 `portfolio.js` store 管理）。



## 共用元件（Common Components）

> 這些元件會出現在不同頁面中，可重複利用。

- `components/Common/HeaderBar.vue`
    - 全站頂部導覽列：顯示 My Stock Map Logo、提供股票搜尋框（支援「/」快捷鍵聚焦）、登入按鈕與深淺色主題切換。

- `components/Common/SideBarMenu.vue`
    - 左側功能選單：依據 `uiState.js` store 的 `tabs` 資訊產生按鈕，並用來切換 **Dashboard** / **Portfolio** / **StockDetail** / **Backtest** / **Reports** / **Settings** 等主要頁面。

- `components/Common/Footer.vue`
    - 頁尾區塊：顯示 Logo 與專案標語、贊助連結群組、作者聯絡 Email 與版權 / 免責說明文字。

- `components/Common/EditHoldingModal.vue`
    - 編輯持股資料的彈出視窗：以表格方式一次調整多檔持股（代碼、名稱、股數、現價、成本），支援新增 / 刪除列，儲存時會更新 `portfolioStore.holdingDetailsData` 並呼叫 `portfolioStore.recalcValues()`，實際的持股資料持久化則由 `portfolio.js` store 統一寫入 `localStorage`。

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



## 未來規劃（Roadmap）

> 現正進行中

- 針對手機或平板使用者做 UI/UX 優化。

- Dashboard 股票趨勢圖，新增可以多檔並列，並讓使用者自訂顯示檔數。

- 完成 `components/StockDetail/HoldingTimelineChart.vue` 的持有時間軸（依實際交易紀錄畫線）。

- 完成 Footer 的超連結與其頁面。

- 統一按鈕樣式。

- 改善 Stock Detail 頁面「價格走勢圖」的 tooltip 互動效果。

- Portfolio 「個人資產變化趨勢圖」加上現金佔比圖。

- Backtest 加入是否開啟「通膨修正」選項。

- 重新調整整體網站配色。

- Dashboard 頁面的大盤市值佔比圖加上上櫃公司，使其能夠在上市公司與上櫃公司間做切換。

- Portfolio 加上個人資產 `週K` / `月K` / `季K` / `年K` 的 [Candlestick Chart](https://observablehq.com/@d3/candlestick-chart/2) 區域。

- Stock Detail 頁面的價格走勢圖改成用 [Candlestick Chart](https://observablehq.com/@d3/candlestick-chart/2)。


> 近期規劃中

- Portfolio 與 Stock Detail 串接實際持股成本，而不是 mock 值。
  - 需要先決定「交易紀錄」資料結構（ex: [{date, id, action, qty, price}]），
  - 再在前端或後端計算成交加總 &現有持股。
  - JavaScript、Pinia、SQLite，只是多一層資料設計 + 邏輯而已。

- 調整 Dashboard 頁面小卡資料串接。

- 調整 Portfolio 頁面小卡資料串接。

- 完成 Reports 頁面中，報表匯入按鈕功能（模板編輯器遮罩）。

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


> 中長期規劃

- 改善後端程式碼架構，將 `server/index.js` 依功能拆分。

- 完成 **登入** / **登出** 功能。
  - 需要補的一些知識：
    - Node.js + Express.js
    - 密碼雜湊（bcrypt）
    - Session 或 JWT
    - 基本的「註冊 / 登入 / 驗證 middleware」

- 與其他使用者的投資競賽（目前投資報酬率相較於於整個專案使用者裡之排名）。
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


## Git Commit 分類（Git Commit Message）
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
|`revert`|⏪ 撤銷回覆先前的commit|
|`chore`|🔨 其他雜項（部署設定、更新套件、CI 設定、建置腳本等）|



## 開發者（Developer）
本案由 [quanting56](https://github.com/quanting56) 開發與維護。

<!-- 若你有任何建議或想法，歡迎開 Issue 或 PR，一起把這個「投資可視化系統」專案變得更好！ -->

> README.md 更新時間：2025/12/07 16:04
