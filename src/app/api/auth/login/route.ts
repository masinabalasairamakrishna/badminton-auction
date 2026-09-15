import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { username, password, teamId } = await request.json();

    const expectedUsername = (process.env.ADMIN_USERNAME || "admin").toLowerCase().trim();
    const expectedPassword = process.env.ADMIN_PASSWORD || "hostel2026";

    const cleanUser = (username || "").toLowerCase().trim();
    const cleanPass = (password || "").trim();

    // 1. Check Admin Credentials
    if (cleanUser === expectedUsername && cleanPass === expectedPassword) {
      return NextResponse.json({
        success: true,
        user: {
          username: "admin",
          role: "admin",
          name: "Tournament Admin",
        },
        token: "admin-session-" + Date.now(),
      });
    }

    // 2. Check Team Captain Credentials
    const db = getDatabase();
    const team = db.teams.find((t) => {
      if (teamId && t.id === teamId) return true;
      if (t.username && t.username.toLowerCase() === cleanUser) return true;
      if (t.id.toLowerCase() === cleanUser) return true;
      if (t.name.toLowerCase() === cleanUser) return true;
      if (t.captain && t.captain.toLowerCase() === cleanUser) return true;
      if (t.captain && t.captain.toLowerCase().split(" ")[0] === cleanUser) return true;
      return false;
    });

    if (team) {
      const captainFirstName = (team.captain || "").toLowerCase().split(" ")[0];
      const validPasscode = team.passcode || `${team.username || "team"}2026`;
      const isPassValid =
        cleanPass === validPasscode ||
        cleanPass === `${captainFirstName}2026` ||
        cleanPass === `${(team.username || "").toLowerCase()}2026` ||
        cleanPass === "captain2026" ||
        cleanPass === "hostel2026";

      if (isPassValid) {
        return NextResponse.json({
          success: true,
          user: {
            username: team.username || team.id,
            role: "captain",
            name: team.captain,
            teamId: team.id,
            teamName: team.name,
            teamLogo: team.logo,
            teamColor: team.color,
          },
          token: `captain-session-${team.id}-${Date.now()}`,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid passcode for ${team.name}. Default is '${team.passcode || "captain2026"}'.`,
          },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Invalid credentials. Log in as Admin ('admin' / 'hostel2026') or as a Team Captain.",
      },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Authentication request failed." },
      { status: 500 }
    );
  }
}
