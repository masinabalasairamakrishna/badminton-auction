import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { extractDriveFileId } from "@/lib/imageDownloader";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return new NextResponse("Missing url parameter", { status: 400 });
    }

    // If already a local upload
    if (imageUrl.startsWith("/uploads/")) {
      return NextResponse.redirect(new URL(imageUrl, request.url));
    }

    const driveId = extractDriveFileId(imageUrl);
    const cacheDir = path.join(process.cwd(), "public", "uploads", "cache");
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    // 1. Check local cache first (disk)
    if (driveId) {
      const cachedFile = path.join(cacheDir, `${driveId}.jpg`);
      if (fs.existsSync(cachedFile)) {
        const buffer = fs.readFileSync(cachedFile);
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "public, max-age=604800, immutable",
          },
        });
      }
    }

    // 2. Candidate URLs to fetch from
    const candidateUrls: string[] = [];
    if (driveId) {
      candidateUrls.push(`https://lh3.googleusercontent.com/d/${driveId}=w1000`);
      candidateUrls.push(`https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`);
      candidateUrls.push(`https://drive.google.com/uc?export=download&id=${driveId}`);
    } else if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      candidateUrls.push(imageUrl);
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
        // If it redirected to an HTML login page, it's not a public image
        if (!contentType.includes("image")) continue;

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        if (buffer.length < 500) continue;

        // Save to cache on disk so all subsequent requests from ANY device are instant
        if (driveId) {
          const cachedFile = path.join(cacheDir, `${driveId}.jpg`);
          try {
            fs.writeFileSync(cachedFile, buffer);
          } catch {}
        }

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=604800, immutable",
          },
        });
      } catch {
        // Continue to next candidate
      }
    }

    // If Google blocked the proxy due to private permissions, redirect to original URL as last resort
    return NextResponse.redirect(imageUrl);
  } catch (err) {
    return new NextResponse("Error proxying image", { status: 500 });
  }
}
