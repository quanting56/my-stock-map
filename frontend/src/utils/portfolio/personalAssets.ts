import { parseTwYmd } from "@/utils/dateNormalize";
import { toNumberOrNull } from "@/utils/numberNormalize";

import type {
  PersonalAssetsRawRow,
  PersonalAssetsRow,
  PersonalAssetsParsedRow
} from "@/types/personalAssets";


// RawRow -> Row，把銀行欄位收進 values
export function rawToRow(raw: PersonalAssetsRawRow): PersonalAssetsRow | null {
  const dateStr = String(raw["日期"] ?? "").trim();
  if (!dateStr) return null;

  const values: Record<string, number | null> = {};

  for (const [k, v] of Object.entries(raw)) {
    if (k === "日期") continue;
    values[k] = toNumberOrNull(v);
  }

  return {
    "日期": dateStr,
    values
  };
}


// Row -> RawRow，把 values 展開回同層，方便存 localStorage/沿用 mock 格式
export function rowToRaw(row: PersonalAssetsRow): PersonalAssetsRawRow {
  const out: PersonalAssetsRawRow = { "日期": row["日期"] };

  for (const [k, v] of Object.entries(row.values)) {
    out[k] = v;
  }

  return out;
}


// Row -> ParsedRow，date 轉 Date、算 totalValue
export function rowToParsed(row: PersonalAssetsRow): PersonalAssetsParsedRow | null {
  const dateStr = String(row["日期"] ?? "").trim();
  const date = parseTwYmd(dateStr);
  if (!date) return null;

  const totalValue = Object.values(row.values)
                           .filter((v): v is number => typeof v === "number")
                           .reduce((acc, v) => acc + v, 0);

  return {
    ...row,
    date,
    totalValue
  };
}


// Row[] -> ParsedRow[]（過濾掉日期無法解析的，並依日期排序）
export function parseRows(rows: PersonalAssetsRow[]): PersonalAssetsParsedRow[] {
  return rows.map(rowToParsed)
             .filter((d): d is PersonalAssetsParsedRow => d != null)
             .sort((a, b) => a.date.getTime() - b.date.getTime());
}


// 取得所有 bank keys（用 union，不只看第一筆，避免有些欄位晚出現）
export function getBankKeys(rows: PersonalAssetsRow[]): string[] {
  const set = new Set<string>();

  for (const r of rows) {
    for (const k of Object.keys(r.values)) set.add(k);
  }

  const keys = Array.from(set);

  // 把「當日持股市值」固定放最後（你常用的特殊欄位）
  const special = "當日持股市值";
  if (keys.includes(special)) {
    return keys.filter((k) => k !== special).concat(special);
  }

  return keys;
}
