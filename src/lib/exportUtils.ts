import { Team, Player } from "@/types";

export function downloadTeamSquadCSV(team: Team, squadPlayers: Player[], currency = "coins") {
  if (!squadPlayers || squadPlayers.length === 0) {
    alert("No players have been acquired by " + team.name + " yet.");
    return;
  }

  const headers = "S.No,Player Name,Roll Number,Branch,Year,Gender,Playing Type,Skill Level,Sold Price (" + currency + ")";
  const rows = squadPlayers.map((p, idx) => {
    return (
      (idx + 1) +
      ',"' + (p.name || "").replace(/"/g, '""') + '"' +
      ',"' + (p.rollNumber || "") + '"' +
      ',"' + (p.branch || "") + '"' +
      ',"' + (p.year || "") + '"' +
      ',"' + (p.gender || "") + '"' +
      ',"' + (p.playingType || "") + '"' +
      ',"' + (p.skillLevel || "") + '"' +
      ',' + (p.finalPrice || p.basePrice || 0)
    );
  });

  const summary = [
    "",
    '"Total Squad Size",' + squadPlayers.length,
    '"Total Spent",' + (team.spent || 0) + ' ' + currency,
    '"Remaining Purse",' + (team.remainingBudget || 0) + ' ' + currency,
    '"Franchise Captain","' + (team.captain || "") + '"',
    '"Export Timestamp","' + new Date().toLocaleString() + '"'
  ].join("\n");

  const csvContent = '"' + team.name.toUpperCase() + ' - OFFICIAL SQUAD ROSTER"\n\n' + headers + '\n' + rows.join("\n") + '\n' + summary + '\n';

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeTeamName = team.name.replace(/[^a-zA-Z0-9_-]/g, "_");
  a.download = safeTeamName + "_Sold_Players_Squad.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
