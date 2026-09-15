import { NextResponse } from "next/server";
import {
  startAuctionForPlayer,
  placeBid,
  undoLastBid,
  pauseAuction,
  resumeAuction,
  markPlayerSold,
  markPlayerUnsold,
  nextQueuePlayer,
  startRound2,
  resetCurrentAuction,
  resetTournamentData,
  setIncrement,
  updateTimer,
  getDatabase,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, role, captainTeamId } = body;

    // Security check: Captains can ONLY perform "BID" action for their own team
    if (role === "captain") {
      if (action !== "BID") {
        return NextResponse.json(
          { success: false, message: "Captains only have permission to place bids." },
          { status: 403 }
        );
      }
      if (captainTeamId && body.teamId && body.teamId !== captainTeamId) {
        return NextResponse.json(
          { success: false, message: "Captains can only place bids for their own team." },
          { status: 403 }
        );
      }
    }

    let result: { success: boolean; message?: string; [key: string]: unknown } = { success: false };

    switch (action) {
      case "START": {
        const { playerId } = body;
        if (!playerId) {
          return NextResponse.json({ success: false, message: "Player ID is required" }, { status: 400 });
        }
        result = startAuctionForPlayer(playerId);
        break;
      }

      case "BID": {
        const { teamId, amount } = body;
        if (!teamId) {
          return NextResponse.json({ success: false, message: "Please select a team." }, { status: 400 });
        }
        result = placeBid(teamId, amount);
        break;
      }

      case "UNDO": {
        result = undoLastBid();
        break;
      }

      case "PAUSE": {
        result = pauseAuction();
        break;
      }

      case "RESUME": {
        result = resumeAuction();
        break;
      }

      case "SOLD": {
        result = markPlayerSold();
        break;
      }

      case "UNSOLD": {
        result = markPlayerUnsold();
        break;
      }

      case "NEXT": {
        result = nextQueuePlayer();
        break;
      }

      case "START_ROUND_2": {
        result = startRound2();
        break;
      }

      case "RESET": {
        result = resetCurrentAuction();
        break;
      }

      case "RESET_ALL": {
        result = resetTournamentData();
        break;
      }

      case "SET_INCREMENT": {
        const { increment } = body;
        result = setIncrement(Number(increment) || 100);
        break;
      }

      case "TICK": {
        const { seconds } = body;
        updateTimer(Number(seconds));
        result = { success: true };
        break;
      }

      default:
        return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    const updatedDb = getDatabase();
    return NextResponse.json({
      ...result,
      database: updatedDb,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
