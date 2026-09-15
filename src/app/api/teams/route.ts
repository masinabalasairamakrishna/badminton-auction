import { NextResponse } from "next/server";
import { getTeams, saveTeam, deleteTeam } from "@/lib/db";
import { Team } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const teams = getTeams();
    return NextResponse.json({ success: true, count: teams.length, teams });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || body.name.trim() === "") {
      return NextResponse.json({ success: false, message: "Team name cannot be empty." }, { status: 400 });
    }

    const budget = Number(body.initialBudget);
    if (isNaN(budget) || budget <= 0) {
      return NextResponse.json({ success: false, message: "Team budget must be greater than zero." }, { status: 400 });
    }

    const teams = getTeams();
    const newTeam: Team = {
      id: body.id || `team-${Date.now()}`,
      name: body.name.trim(),
      logo: body.logo || "🏸",
      color: body.color || "#10b981",
      captain: body.captain?.trim() || "Captain",
      initialBudget: budget,
      remainingBudget: budget,
      spent: 0,
      players: [],
    };

    const saved = saveTeam(newTeam);
    return NextResponse.json({ success: true, team: saved });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, message: "Team ID is required." }, { status: 400 });
    }

    if (body.name && body.name.trim() === "") {
      return NextResponse.json({ success: false, message: "Team name cannot be empty." }, { status: 400 });
    }

    const updated = saveTeam(body);
    return NextResponse.json({ success: true, team: updated });
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
      return NextResponse.json({ success: false, message: "Team ID is required." }, { status: 400 });
    }

    const deleted = deleteTeam(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: "Team not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
