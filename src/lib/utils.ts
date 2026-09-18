export function formatCurrency(amount: number | undefined | null, currency: string = "coins"): string {
  if (amount === undefined || amount === null) return "—";
  const formatted = amount.toLocaleString("en-IN");
  if (currency === "₹" || currency === "$" || currency === "€" || currency === "£") {
    return `${currency}${formatted}`;
  }
  return `${formatted} ${currency}`;
}

export function resolvePlayerPhoto(photo?: string | null): string | null {
  if (!photo) return null;
  const trimmed = photo.trim();
  if (!trimmed) return null;
  return trimmed;
}
