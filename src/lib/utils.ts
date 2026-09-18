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
  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("data:") || trimmed.startsWith("/api/image-proxy")) {
    return trimmed;
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return `/api/image-proxy?url=${encodeURIComponent(trimmed)}`;
  }
  if (trimmed.startsWith("/")) {
    return trimmed;
  }
  return null;
}
