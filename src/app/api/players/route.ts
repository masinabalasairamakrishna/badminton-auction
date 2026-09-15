import { NextResponse } from "next/server";
import { getPlayers, savePlayer, deletePlayer } from "@/lib/db";
import { Player } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.toLowerCase();
    const status = searchParams.get("status");
    const playingType = searchParams.get("playingType");
    const skillLevel = searchParams.get("skillLevel");
    const branch = searchParams.get("branch");

    let players = getPlayers();

    if (query) {
      players = players.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.rollNumber.toLowerCase().includes(query) ||
          p.branch.toLowerCase().includes(query)
      );
    }

    if (status && status !== "All") {
      players = players.filter((p) => p.status === status);
    }

    if (playingType && playingType !== "All") {
      players = players.filter((p) => p.playingType === playingType);
    }

    if (skillLevel && skillLevel !== "All") {
      players = players.filter((p) => p.skillLevel === skillLevel);
    }

    if (branch && branch !== "All") {
      players = players.filter((p) => p.branch === branch);
    }

    return NextResponse.json({ success: true, count: players.length, players });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || body.name.trim() === "") {
      return NextResponse.json({ success: false, message: "Player name cannot be empty." }, { status: 400 });
    }

    const basePrice = Number(body.basePrice);
    if (isNaN(basePrice) || basePrice <= 0) {
      return NextResponse.json({ success: false, message: "Base price must be greater than zero." }, { status: 400 });
    }

    const players = getPlayers();
    const existingRoll = players.find(
      (p) => p.rollNumber.toLowerCase() === (body.rollNumber || "").toLowerCase().trim()
    );
    if (existingRoll) {
      return NextResponse.json(
        { success: false, message: `Player with roll number ${body.rollNumber} already exists.` },
        { status: 400 }
      );
    }

    const newPlayer: Player = {
      id: body.id || `player-${Date.now()}`,
      name: body.name.trim(),
      photo: body.photo || undefined,
      rollNumber: body.rollNumber ? body.rollNumber.trim() : `HD-${100 + players.length + 1}`,
      branch: body.branch || "General",
      year: body.year || "3rd",
      gender: body.gender || "Male",
      playingType: body.playingType || "Both",
      skillLevel: body.skillLevel || "Intermediate",
      basePrice,
      status: "Available",
      queueOrder: players.length + 1,
      notes: body.notes || "",
    };

    const saved = savePlayer(newPlayer);
    return NextResponse.json({ success: true, player: saved });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, message: "Player ID is required." }, { status: 400 });
    }

    if (body.name && body.name.trim() === "") {
      return NextResponse.json({ success: false, message: "Player name cannot be empty." }, { status: 400 });
    }

    if (body.basePrice !== undefined && Number(body.basePrice) <= 0) {
      return NextResponse.json({ success: false, message: "Base price must be greater than zero." }, { status: 400 });
    }

    const updated = savePlayer(body);
    return NextResponse.json({ success: true, player: updated });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "Player ID is required." }, { status: 400 });
    }

    const deleted = deletePlayer(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: "Player not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
