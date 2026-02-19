// 把值轉換成可以用的 number 或 null
export function toNumberOrNull(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;

  if (typeof v === "string") {
    const s = v.trim();
    if (s === "") return null;
    const num = Number(s.replace(/,/g, ""));
    return Number.isFinite(num) ? num : null;
  }

  return null;
}