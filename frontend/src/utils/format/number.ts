const quantityFormatter = new Intl.NumberFormat("zh-TW", {
  useGrouping: true,
  maximumFractionDigits: 0,
});

const priceFormatter = new Intl.NumberFormat("zh-TW", {
  useGrouping: false,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const amountFormatter = new Intl.NumberFormat("zh-TW", {
  useGrouping: true,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const signedAmountFormatter = new Intl.NumberFormat("zh-TW", {
  useGrouping: true,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "always",
});

const percentageFormatter = new Intl.NumberFormat("zh-TW", {
  useGrouping: true,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const signedPercentageFormatter = new Intl.NumberFormat("zh-TW", {
  useGrouping: true,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "always",
});

/** 格式化持股數量，例如 `1675` → `1,675`。 */
export function formatQuantity(value: number): string {
  return quantityFormatter.format(value);
}

/** 格式化單位價格，例如 `1460` → `1460.00`。 */
export function formatPrice(value: number): string {
  return priceFormatter.format(value);
}

/** 格式化一般金額，例如 `42963.75` → `42,963.75`。 */
export function formatAmount(value: number): string {
  return amountFormatter.format(value);
}

/** 格式化帶正負號的金額，例如 `77200` → `+77,200.00`。 */
export function formatSignedAmount(value: number): string {
  return signedAmountFormatter.format(value);
}

/** 格式化百分比，例如 `0.442813` → `44.28%`。 */
export function formatPercentage(value: number): string {
  return `${percentageFormatter.format(value * 100)}%`;
}

/** 格式化帶正負號的百分比，例如 `0.16` → `+16.00%`。 */
export function formatSignedPercentage(value: number): string {
  return `${signedPercentageFormatter.format(value * 100)}%`;
}
