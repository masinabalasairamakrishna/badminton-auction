import { NextResponse } from "next/server";
import { getDatabase, saveDatabase } from "@/lib/db";
import { downloadAndSaveImage } from "@/lib/imageDownloader";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const db = getDatabase();
    let downloadedCount = 0;
    const failedPlayers: { id: string; name: string; photo?: string }[] = [];
    const updatedPlayers: { id: string; name: string; photo: string }[] = [];

    for (const player of db.players) {
      if (!player.photo) continue;

      // Only attempt to download if photo is an external URL (starts with http)
      if (player.photo.startsWith("http://") || player.photo.startsWith("https://")) {
        const safeName = `${player.name.replace(/[^a-zA-Z0-9_-]/g, "_")}-${player.id}`;
        const savedUrl = await downloadAndSaveImage(player.photo, safeName);

        if (savedUrl) {
          player.photo = savedUrl;
          downloadedCount++;
          updatedPlayers.push({ id: player.id, name: player.name, photo: savedUrl });
        } else {
          failedPlayers.push({ id: player.id, name: player.name, photo: player.photo });
        }
      }
    }

    if (downloadedCount > 0) {
      saveDatabase(db);
    }

    return NextResponse.json({
      success: true,
      message:
        downloadedCount > 0
          ? `Successfully saved ${downloadedCount} photos permanently to local disk!`
          : "No photos could be downloaded. Check Google Drive folder sharing settings.",
      downloadedCount,
      failedCount: failedPlayers.length,
      updatedPlayers,
      failedPlayers,
      hint:
        failedPlayers.length > 0
          ? "For Google Drive links: open Google Drive, right-click the Form Responses folder, click 'Share', and change General access to 'Anyone with the link' (Viewer). Or upload photos directly from your device."
          : null,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
