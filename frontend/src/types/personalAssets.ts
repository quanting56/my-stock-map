/**
 * 從 JSON 或 `localStorage` 取得、尚未正規化的原始個人資產資料。
 *
 * 原始資料範例：
 *
 * ```json
 * {
 *   "日期": "2026/02/15",
 *   "台新銀行": 100,
 *   "合作金庫銀行": 300,
 *   "郵局": 200,
 *   "國泰世華銀行": null,
 *   "當日持股市值": 700
 * }
 * ```
 */
export type PersonalAssetsRawRow = {
  日期: string;
  [key: string]: unknown;
};

/**
 * 正規化後的個人資產資料，將各資產欄位收進 `values`。
 *
 * 正規化後長這樣：
 *
 * ```ts
 * {
 *   "日期": "2026/02/15",
 *   values: {
 *     "台新銀行": 100,
 *     "合作金庫銀行": 300,
 *     "郵局": 200,
 *     "國泰世華銀行": null,
 *     "當日持股市值": 700,
 *   }
 * }
 * ```
 */
export interface PersonalAssetsRow {
  日期: string;
  values: Record<string, number | null>;
}

/**
 * 解析後的個人資產資料，可直接用於資料視覺化與數值計算。
 *
 * 解析後長這樣：
 *
 * ```ts
 * {
 *   "日期": "2026/02/15",
 *   date: new Date(2026, 1, 15),
 *   values: {
 *     "台新銀行": 100,
 *     "合作金庫銀行": 300,
 *     "郵局": 200,
 *     "國泰世華銀行": null,
 *     "當日持股市值": 700,
 *   },
 *   totalValue: 1300,
 * }
 * ```
 */
export type PersonalAssetsParsedRow = PersonalAssetsRow & {
  date: Date;
  totalValue: number;
};
