export function formatCurrency(amount: number | undefined | null, currency: string = "coins"): string {
  if (amount === undefined || amount === null) return "—";
  const formatted = amount.toLocaleString("en-IN");
  if (currency === "₹" || currency === "$" || currency === "€" || currency === "£") {
    return `${currency}${formatted}`;
  }
  return `${formatted} ${currency}`;
}

export function extractDriveFileId(url?: string | null): string | null {
  if (!url) return null;
  const match =
    url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    url.match(/id=([a-zA-Z0-9_-]+)/) ||
    url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export function resolvePlayerPhoto(photo?: string | null): string | null {
  if (!photo) return null;
  const trimmed = photo.trim();
  if (!trimmed) return null;

  // Ignore invalid strings that are not web URLs or local paths
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("/")) {
    return null;
  }

  // If already a local uploaded file, return directly
  if (trimmed.startsWith("/uploads/")) {
    return trimmed;
  }

  // If Google Drive link, extract ID and return direct high-res CDN format
  const driveId = extractDriveFileId(trimmed);
  if (driveId) {
    return `https://lh3.googleusercontent.com/d/${driveId}=w1000`;
  }

  return trimmed;
}
