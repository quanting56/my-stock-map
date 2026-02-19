// 從 JSON / localStorage 進來，尚未正規化的原始資料
export type PersonalAssetsRawRow = {
  "日期": string;
  [key: string]: unknown;
};

// raw data 可能長這樣
// {
//   "日期": 2026-02-15,
//   "台新銀行": 100,
//   "合作金庫銀行": 300,
//   "郵局": 200,
//   "國泰世華銀行": null,
//   "當日持股市值": 700
// }


// normalize 後，保留原 key（銀行欄位收進 values）
export interface PersonalAssetsRow {
  "日期": string;
  values: Record<string, number | null>;
};

// normalize 後長這樣
// {
//   "日期": 2026-02-15;
//   values: {
//     "台新銀行": 100,
//     "合作金庫銀行": 300,
//     "郵局": 200,
//     "國泰世華銀行": null,
//     "當日持股市值": 700
//   }
// }


// Parsed 後，可拿來繪圖、計算
export type PersonalAssetsParsedRow = PersonalAssetsRow & {
  date: Date;
  totalValue: number;
};

// Parsed 後長這樣
// {
//   "日期": 2026-02-15;
//   date: Sun Feb 15 2026 22:02:46 GMT+0800 (台北標準時間);
//   values: {
//     "台新銀行": 100,
//     "合作金庫銀行": 300,
//     "郵局": 200,
//     "國泰世華銀行": null,
//     "當日持股市值": 700
//   },
//   totalValue: 1300;
// }
