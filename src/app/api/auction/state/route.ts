import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDatabase();
    return NextResponse.json({
      success: true,
      data: db,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: errorMsg },
      { status: 500 }
    );
  }
}
