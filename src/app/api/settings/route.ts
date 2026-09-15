import { NextResponse } from "next/server";
import { getDatabase, saveDatabase, resetAllData } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDatabase();
    return NextResponse.json({ success: true, settings: db.settings });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "RESET_ALL") {
      const freshDb = resetAllData();
      return NextResponse.json({
        success: true,
        message: "All tournament data, teams, and players have been reset to default sample dataset.",
        database: freshDb,
      });
    }

    const db = getDatabase();
    db.settings = {
      ...db.settings,
      ...body,
    };
    saveDatabase(db);

    return NextResponse.json({
      success: true,
      message: "Tournament settings updated successfully.",
      settings: db.settings,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
