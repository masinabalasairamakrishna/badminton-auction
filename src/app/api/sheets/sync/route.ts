import { NextResponse } from "next/server";
import { syncPlayersFromGoogleSheets } from "@/lib/googleSheets";
import { getDatabase, saveDatabase } from "@/lib/db";
import { Player } from "@/types";

export const dynamic = "force-dynamic";

// Bypass hostel/college network SSL inspection proxy for outgoing Google Sheets fetch
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { sheetId, csvUrl, rawContent, mode = "append" } = body; // mode: "append" or "replace"

    const syncResult = await syncPlayersFromGoogleSheets({
      sheetId,
      csvUrl,
      rawContent,
    });

    if (!syncResult.success || !syncResult.players) {
      return NextResponse.json(syncResult, { status: 400 });
    }

    const db = getDatabase();

    if (mode === "replace") {
      // Keep teams and settings, replace players
      db.players = syncResult.players;
    } else {
      // Append / merge players without duplicates
      const existingRolls = new Set(db.players.map((p) => p.rollNumber.toLowerCase().trim()));
      const newPlayers: Player[] = [];

      syncResult.players.forEach((p) => {
        if (!existingRolls.has(p.rollNumber.toLowerCase().trim())) {
          newPlayers.push({
            ...p,
            queueOrder: db.players.length + newPlayers.length + 1,
          });
        }
      });

      db.players = [...db.players, ...newPlayers];
      syncResult.importedCount = newPlayers.length;
      syncResult.message = `Imported ${newPlayers.length} new players from Google Sheet (${syncResult.players.length - newPlayers.length} existing players skipped).`;
    }

    saveDatabase(db);

    return NextResponse.json({
      success: true,
      message: syncResult.message,
      importedCount: syncResult.importedCount,
      totalPlayers: db.players.length,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
