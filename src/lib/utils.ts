export function formatCurrency(amount: number | undefined | null, currency: string = "coins"): string {
  if (amount === undefined || amount === null) return "—";
  const formatted = amount.toLocaleString("en-IN");
  if (currency === "₹" || currency === "$" || currency === "€" || currency === "£") {
    return `${currency}${formatted}`;
  }
  return `${formatted} ${currency}`;
}
