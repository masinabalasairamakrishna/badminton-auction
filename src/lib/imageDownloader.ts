import fs from "fs";
import path from "path";

// Ensure Node TLS allows college/hostel proxies
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export function getUploadsDir(): string {
  const dir = path.join(process.cwd(), "public", "uploads", "players");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  const match =
    url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    url.match(/id=([a-zA-Z0-9_-]+)/) ||
    url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Downloads an image from Google Drive or an external URL and saves it permanently to disk.
 * Returns the public URL (e.g., "/uploads/players/{filename}") if successful, or null if failed.
 */
export async function downloadAndSaveImage(
  imageUrl: string,
  fileNameWithoutExt: string
): Promise<string | null> {
  try {
    const uploadsDir = getUploadsDir();
    const driveId = extractDriveFileId(imageUrl);

    const candidateUrls: string[] = [];

    if (driveId) {
      // Google Drive direct CDN endpoints
      candidateUrls.push(`https://lh3.googleusercontent.com/d/${driveId}=w1000`);
      candidateUrls.push(`https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`);
      candidateUrls.push(`https://drive.google.com/uc?export=download&id=${driveId}`);
    } else if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      candidateUrls.push(imageUrl);
    } else {
      return null;
    }

    for (const targetUrl of candidateUrls) {
      try {
        const response = await fetch(targetUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          },
          redirect: "follow",
        });

        if (!response.ok) continue;

        const contentType = response.headers.get("content-type") || "";
        // If Google redirected to an HTML login page, it's restricted
        if (!contentType.includes("image")) continue;

        let ext = "jpg";
        if (contentType.includes("png")) ext = "png";
        else if (contentType.includes("webp")) ext = "webp";
        else if (contentType.includes("gif")) ext = "gif";

        const fileName = `${fileNameWithoutExt}.${ext}`;
        const filePath = path.join(uploadsDir, fileName);

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Sanity check: must be at least 500 bytes to be a valid image
        if (buffer.length < 500) continue;

        fs.writeFileSync(filePath, buffer);
        console.log(`[ImageDownloader] Successfully saved ${buffer.length} bytes to ${filePath}`);

        return `/uploads/players/${fileName}`;
      } catch (e) {
        console.warn(`[ImageDownloader] Attempt to fetch ${targetUrl} failed:`, e);
      }
    }
  } catch (err) {
    console.error("[ImageDownloader] Error in downloadAndSaveImage:", err);
  }

  return null;
}
