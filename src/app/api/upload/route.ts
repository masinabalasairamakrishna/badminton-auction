import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getUploadsDir } from "@/lib/imageDownloader";
import { getDatabase, saveDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    const uploadsDir = getUploadsDir();

    let fileName = "";
    let playerId: string | null = null;
    let fileBuffer: Buffer | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      playerId = (formData.get("playerId") as string) || null;

      if (!file) {
        return NextResponse.json({ success: false, message: "No file uploaded." }, { status: 400 });
      }

      // Determine extension
      let ext = "jpg";
      const origName = file.name || "";
      const dotIdx = origName.lastIndexOf(".");
      if (dotIdx >= 0) {
        ext = origName.substring(dotIdx + 1).toLowerCase();
      }
      if (!["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
        ext = "jpg";
      }

      const safeId = (playerId || `player-${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, "_");
      fileName = `${safeId}-${Date.now()}.${ext}`;

      const arrayBuf = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuf);
    } else {
      // JSON body (base64)
      const body = await request.json().catch(() => ({}));
      const { base64, ext = "jpg" } = body;
      playerId = body.playerId || null;

      if (!base64) {
        return NextResponse.json({ success: false, message: "No image data provided." }, { status: 400 });
      }

      const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
      fileBuffer = Buffer.from(base64Data, "base64");

      const safeId = (playerId || `player-${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, "_");
      fileName = `${safeId}-${Date.now()}.${ext}`;
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json({ success: false, message: "Image buffer is empty." }, { status: 400 });
    }

    const targetPath = path.join(uploadsDir, fileName);
    fs.writeFileSync(targetPath, fileBuffer);

    const publicUrl = `/uploads/players/${fileName}`;

    // If playerId is provided, persist it to the database immediately
    if (playerId) {
      const db = getDatabase();
      const player = db.players.find((p) => p.id === playerId);
      if (player) {
        player.photo = publicUrl;
        saveDatabase(db);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Image uploaded and permanently saved.",
      photoUrl: publicUrl,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
