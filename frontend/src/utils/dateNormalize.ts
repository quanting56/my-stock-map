/**
 * 將 `YYYY/M/D` 或 `YYYY/MM/DD` 格式的日期字串解析為 `Date`。
 *
 * 日期格式無效或日期不存在時回傳 `null`。
 */
export function parseTwYmd(input: string): Date | null {
  const s = String(input).trim();
  const m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);

  if (!m) {
    return null;
  }

  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);

  const dt = new Date(y, mo - 1, d);

  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
    return null;
  }

  return dt;
}
