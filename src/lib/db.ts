import fs from "fs";
import path from "path";
import { DatabaseSchema, Player, Team, Bid, AuctionState, AuctionHistoryItem, TournamentSettings } from "@/types";
import { initialDatabase } from "@/data/seed";
import { formatCurrency } from "@/lib/utils";

const DB_DIR = path.join(process.cwd(), "src", "data");
const DB_FILE = path.join(DB_DIR, "auction-db.json");

// In-memory cache & event subscribers for SSE
let inMemoryDb: DatabaseSchema | null = null;
type Listener = (data: DatabaseSchema) => void;
const subscribers: Set<Listener> = new Set();

export function subscribeToUpdates(listener: Listener): () => void {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
}

function notifySubscribers(data: DatabaseSchema) {
  for (const listener of subscribers) {
    try {
      listener(data);
    } catch (e) {
      console.error("Subscriber notification error", e);
    }
  }
}

export function getDatabase(): DatabaseSchema {
  if (inMemoryDb) {
    return inMemoryDb;
  }

  try {
    if (fs.existsSync(DB_FILE)) {
      const fileData = fs.readFileSync(DB_FILE, "utf-8");
      inMemoryDb = JSON.parse(fileData);
      return inMemoryDb!;
    }
  } catch (err) {
    console.warn("Could not read DB file, using initial data", err);
  }

  // Initialize DB with seed
  inMemoryDb = JSON.parse(JSON.stringify(initialDatabase));
  saveDatabase(inMemoryDb!);
  return inMemoryDb!;
}

export function saveDatabase(data: DatabaseSchema): void {
  inMemoryDb = data;
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not write DB file to disk, relying on in-memory state", err);
  }
  notifySubscribers(data);
}

// Reset all data back to original seed
export function resetAllData(): DatabaseSchema {
  const fresh = JSON.parse(JSON.stringify(initialDatabase));
  saveDatabase(fresh);
  return fresh;
}

// Player helpers
export function getPlayers(): Player[] {
  const db = getDatabase();
  return db.players.sort((a, b) => a.queueOrder - b.queueOrder);
}

export function getPlayer(id: string): Player | undefined {
  const db = getDatabase();
  return db.players.find((p) => p.id === id);
}

export function savePlayer(player: Player): Player {
  const db = getDatabase();
  const index = db.players.findIndex((p) => p.id === player.id);
  if (index >= 0) {
    db.players[index] = player;
  } else {
    db.players.push(player);
  }
  saveDatabase(db);
  return player;
}

export function deletePlayer(id: string): boolean {
  const db = getDatabase();
  const initialLen = db.players.length;
  db.players = db.players.filter((p) => p.id !== id);
  if (db.players.length !== initialLen) {
    saveDatabase(db);
    return true;
  }
  return false;
}

// Team helpers
export function getTeams(): Team[] {
  const db = getDatabase();
  return db.teams;
}

export function getTeam(id: string): Team | undefined {
  const db = getDatabase();
  return db.teams.find((t) => t.id === id);
}

export function saveTeam(team: Team): Team {
  const db = getDatabase();
  const index = db.teams.findIndex((t) => t.id === team.id);
  if (index >= 0) {
    db.teams[index] = team;
  } else {
    db.teams.push(team);
  }
  saveDatabase(db);
  return team;
}

export function deleteTeam(id: string): boolean {
  const db = getDatabase();
  const initialLen = db.teams.length;
  db.teams = db.teams.filter((t) => t.id !== id);
  if (db.teams.length !== initialLen) {
    saveDatabase(db);
    return true;
  }
  return false;
}

// Auction engine operations
export function startAuctionForPlayer(playerId: string): { success: boolean; message?: string } {
  const db = getDatabase();
  const player = db.players.find((p) => p.id === playerId);
  if (!player) {
    return { success: false, message: "Player not found" };
  }
  if (player.status === "Sold") {
    return { success: false, message: "This player has already been sold." };
  }

  // Set any other Live player back to Available (or Unsold if previously unsold)
  db.players.forEach((p) => {
    if (p.status === "Live" && p.id !== playerId) {
      p.status = p.unsoldRound ? "Unsold" : "Available";
    }
  });

  // Determine round: If player was unsold in Round 1 or marked round 2, this is Round 2!
  const isRound2 =
    player.status === "Unsold" ||
    player.unsoldRound === 1 ||
    player.round === 2 ||
    db.auctionState.currentRound === 2;
  const currentRound = isRound2 ? 2 : 1;
  player.round = currentRound;
  player.status = "Live";

  db.auctionState = {
    ...db.auctionState,
    status: "LIVE",
    currentRound,
    currentPlayerId: playerId,
    currentBid: player.basePrice,
    highestBidTeamId: null,
    highestBidTeamName: null,
    timerSeconds: db.settings.auctionTimer || 30,
    initialTimerSeconds: db.settings.auctionTimer || 30,
    lastAction: `${
      currentRound === 2 ? "🔄 Round 2 (Second Chance): " : ""
    }Auction started for ${player.name} at ${formatCurrency(player.basePrice, db.settings.currency)}`,
    bidHistory: [],
  };

  saveDatabase(db);
  return { success: true };
}

export function placeBid(teamId: string, amount?: number): { success: boolean; message?: string } {
  const db = getDatabase();
  const state = db.auctionState;

  if (state.status !== "LIVE" || !state.currentPlayerId) {
    return { success: false, message: "Auction is not currently active." };
  }

  const team = db.teams.find((t) => t.id === teamId);
  if (!team) {
    return { success: false, message: "Selected team does not exist." };
  }

  const player = db.players.find((p) => p.id === state.currentPlayerId);
  if (!player) {
    return { success: false, message: "Current player not found." };
  }

  // Determine bid amount
  let newAmount: number;
  if (amount && amount > state.currentBid) {
    newAmount = amount;
  } else {
    // If no bids yet, first bid can be at basePrice or basePrice + increment
    if (!state.highestBidTeamId) {
      newAmount = state.currentBid; // Open at base price
    } else {
      newAmount = state.currentBid + (state.selectedIncrement || 100);
    }
  }

  // Check budget
  if (team.remainingBudget < newAmount) {
    return {
      success: false,
      message: `Insufficient team budget! ${team.name} only has ${formatCurrency(team.remainingBudget, db.settings.currency)}, needed ${formatCurrency(newAmount, db.settings.currency)}.`,
    };
  }

  // Record bid
  const bid: Bid = {
    id: `bid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    playerId: player.id,
    playerName: player.name,
    teamId: team.id,
    teamName: team.name,
    teamColor: team.color,
    amount: newAmount,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    adminUser: "Admin",
  };

  state.currentBid = newAmount;
  state.highestBidTeamId = team.id;
  state.highestBidTeamName = team.name;
  state.timerSeconds = db.settings.auctionTimer || 30; // Reset timer on bid
  state.lastAction = `Bid ${formatCurrency(newAmount, db.settings.currency)} by ${team.name}`;
  state.bidHistory.unshift(bid);

  db.bids.unshift(bid);
  saveDatabase(db);

  return { success: true };
}

export function undoLastBid(): { success: boolean; message?: string } {
  const db = getDatabase();
  const state = db.auctionState;

  if (state.bidHistory.length === 0) {
    return { success: false, message: "No bids to undo for current player." };
  }

  // Remove the latest bid
  state.bidHistory.shift();
  if (db.bids.length > 0) {
    db.bids.shift();
  }

  if (state.bidHistory.length > 0) {
    const prevBid = state.bidHistory[0];
    state.currentBid = prevBid.amount;
    state.highestBidTeamId = prevBid.teamId;
    state.highestBidTeamName = prevBid.teamName;
    state.lastAction = `Undone. Current highest: ${formatCurrency(prevBid.amount, db.settings.currency)} by ${prevBid.teamName}`;
  } else {
    // Revert to player's base price
    const player = db.players.find((p) => p.id === state.currentPlayerId);
    state.currentBid = player ? player.basePrice : 0;
    state.highestBidTeamId = null;
    state.highestBidTeamName = null;
    state.lastAction = "Undone all bids. Reset to base price.";
  }

  state.timerSeconds = db.settings.auctionTimer || 30;
  saveDatabase(db);
  return { success: true };
}

export function pauseAuction(): { success: boolean } {
  const db = getDatabase();
  if (db.auctionState.status === "LIVE") {
    db.auctionState.status = "PAUSED";
    db.auctionState.lastAction = "Auction paused";
    saveDatabase(db);
  }
  return { success: true };
}

export function resumeAuction(): { success: boolean } {
  const db = getDatabase();
  if (db.auctionState.status === "PAUSED") {
    db.auctionState.status = "LIVE";
    db.auctionState.lastAction = "Auction resumed";
    saveDatabase(db);
  }
  return { success: true };
}

export function markPlayerSold(): { success: boolean; message?: string; player?: Player; team?: Team; finalPrice?: number } {
  const db = getDatabase();
  const state = db.auctionState;

  if (!state.currentPlayerId) {
    return { success: false, message: "No active player selected." };
  }

  if (!state.highestBidTeamId) {
    return { success: false, message: "Cannot mark SOLD without any bids! Use UNSOLD instead." };
  }

  const player = db.players.find((p) => p.id === state.currentPlayerId);
  const team = db.teams.find((t) => t.id === state.highestBidTeamId);

  if (!player || !team) {
    return { success: false, message: "Player or Team not found." };
  }

  const finalPrice = state.currentBid;

  // Deduct team budget and add player to squad
  team.remainingBudget -= finalPrice;
  team.spent += finalPrice;
  if (!team.players.includes(player.id)) {
    team.players.push(player.id);
  }

  // Update player status
  player.status = "Sold";
  player.soldTo = team.id;
  player.soldToTeamName = team.name;
  player.finalPrice = finalPrice;

  // Record history
  const historyItem: AuctionHistoryItem = {
    id: `history-${Date.now()}`,
    playerId: player.id,
    playerName: player.name,
    teamId: team.id,
    teamName: team.name,
    finalPrice: finalPrice,
    status: "Sold",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    totalBids: state.bidHistory.length,
  };
  db.auctionHistory.unshift(historyItem);

  // Set auction state to ENDED / Idle
  state.status = "ENDED";
  state.lastAction = `🎉 SOLD! ${player.name} to ${team.name} for ${formatCurrency(finalPrice, db.settings.currency)}`;

  saveDatabase(db);
  return { success: true, player, team, finalPrice };
}

export function markPlayerUnsold(): { success: boolean; message?: string; player?: Player } {
  const db = getDatabase();
  const state = db.auctionState;

  if (!state.currentPlayerId) {
    return { success: false, message: "No active player selected." };
  }

  const player = db.players.find((p) => p.id === state.currentPlayerId);
  if (!player) {
    return { success: false, message: "Player not found." };
  }

  // Determine if this player was in Round 2
  const isRound2 =
    player.round === 2 ||
    state.currentRound === 2 ||
    player.unsoldRound === 1;

  player.status = "Unsold";
  player.soldTo = undefined;
  player.soldToTeamName = undefined;
  player.finalPrice = undefined;

  if (isRound2) {
    player.round = 2;
    player.unsoldRound = 2; // Finished round 2 unsold (final)
  } else {
    player.round = 1;
    player.unsoldRound = 1; // Unsold in round 1, eligible for round 2
  }

  // Record history
  const historyItem: AuctionHistoryItem = {
    id: `history-${Date.now()}`,
    playerId: player.id,
    playerName: player.name,
    status: "Unsold",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    totalBids: state.bidHistory.length,
  };
  db.auctionHistory.unshift(historyItem);

  state.status = "ENDED";
  state.lastAction = isRound2
    ? `Player ${player.name} marked UNSOLD in Round 2 (Final).`
    : `Player ${player.name} marked UNSOLD (Will return in Round 2!).`;

  saveDatabase(db);
  return { success: true, player };
}

export function nextQueuePlayer(): { success: boolean; nextPlayerId?: string } {
  const db = getDatabase();
  const currentId = db.auctionState.currentPlayerId;
  const currentPlayer = db.players.find((p) => p.id === currentId);
  const currentOrder = currentPlayer?.queueOrder || 0;
  const isCurrentlyRound2 =
    db.auctionState.currentRound === 2 ||
    (currentPlayer?.round === 2 && currentPlayer?.unsoldRound === 2);

  // 1. If in Round 1, check if there are remaining Available players in Round 1
  if (!isCurrentlyRound2) {
    const afterR1 = db.players
      .filter((p) => p.status === "Available" && (!p.round || p.round === 1) && p.queueOrder > currentOrder)
      .sort((a, b) => a.queueOrder - b.queueOrder);

    const beforeR1 = db.players
      .filter((p) => p.status === "Available" && (!p.round || p.round === 1) && p.queueOrder <= currentOrder && p.id !== currentId)
      .sort((a, b) => a.queueOrder - b.queueOrder);

    const nextR1 = afterR1[0] || beforeR1[0];
    if (nextR1) {
      startAuctionForPlayer(nextR1.id);
      return { success: true, nextPlayerId: nextR1.id };
    }

    // No more Round 1 Available players! Round 1 is complete.
    // Transition to Round 2 with any player who went unsold in Round 1 (unsoldRound === 1)
    const round2Candidates = db.players
      .filter((p) => p.status === "Unsold" && p.unsoldRound === 1 && p.id !== currentId)
      .sort((a, b) => a.queueOrder - b.queueOrder);

    const allR2Pool = db.players
      .filter((p) => p.status === "Unsold" && p.unsoldRound === 1)
      .sort((a, b) => a.queueOrder - b.queueOrder);

    const afterR2 = round2Candidates.filter((p) => p.queueOrder > currentOrder);
    const nextR2 =
      afterR2[0] ||
      round2Candidates[0] ||
      (allR2Pool.length === 1 && allR2Pool[0].id === currentId ? allR2Pool[0] : undefined);

    if (nextR2) {
      db.auctionState.currentRound = 2;
      startAuctionForPlayer(nextR2.id);
      return { success: true, nextPlayerId: nextR2.id };
    }
  } else {
    // 2. We are in Round 2. Find next unsold player eligible for Round 2
    const round2Candidates = db.players
      .filter((p) => p.status === "Unsold" && p.unsoldRound === 1 && p.id !== currentId)
      .sort((a, b) => a.queueOrder - b.queueOrder);

    const afterR2 = round2Candidates.filter((p) => p.queueOrder > currentOrder);
    const nextR2 = afterR2[0] || round2Candidates[0];

    if (nextR2) {
      db.auctionState.currentRound = 2;
      startAuctionForPlayer(nextR2.id);
      return { success: true, nextPlayerId: nextR2.id };
    }
  }

  // If no available or unsold players left in either round:
  db.auctionState.status = "IDLE";
  db.auctionState.currentPlayerId = null;
  db.auctionState.currentBid = 0;
  db.auctionState.highestBidTeamId = null;
  db.auctionState.highestBidTeamName = null;
  db.auctionState.bidHistory = [];
  db.auctionState.lastAction = "Auction concluded! All players across all rounds have been auctioned.";
  saveDatabase(db);

  return { success: false };
}

export function startRound2(): { success: boolean; message?: string; nextPlayerId?: string } {
  const db = getDatabase();
  const r2Players = db.players
    .filter((p) => p.status === "Unsold" && p.unsoldRound === 1)
    .sort((a, b) => a.queueOrder - b.queueOrder);

  if (r2Players.length === 0) {
    return { success: false, message: "No unsold players eligible for Round 2." };
  }

  db.auctionState.currentRound = 2;
  const res = startAuctionForPlayer(r2Players[0].id);
  return { ...res, nextPlayerId: r2Players[0].id };
}

export function resetCurrentAuction(): { success: boolean } {
  const db = getDatabase();
  const state = db.auctionState;

  if (state.currentPlayerId) {
    const player = db.players.find((p) => p.id === state.currentPlayerId);
    if (player && player.status === "Live") {
      player.status = player.unsoldRound ? "Unsold" : "Available";
    }
  }

  state.status = "IDLE";
  state.currentPlayerId = null;
  state.currentBid = 0;
  state.highestBidTeamId = null;
  state.highestBidTeamName = null;
  state.timerSeconds = db.settings.auctionTimer || 30;
  state.bidHistory = [];
  state.lastAction = "Current auction reset to idle.";

  saveDatabase(db);
  return { success: true };
}

export function setIncrement(increment: number): { success: boolean } {
  const db = getDatabase();
  db.auctionState.selectedIncrement = increment;
  saveDatabase(db);
  return { success: true };
}

export function updateTimer(seconds: number): void {
  const db = getDatabase();
  db.auctionState.timerSeconds = seconds;
  if (seconds <= 0 && db.auctionState.status === "LIVE") {
    db.auctionState.status = "ENDED";
    db.auctionState.lastAction = "⏰ Time's Up! Place SOLD or UNSOLD decision.";
  }
  saveDatabase(db);
}

export function resetTournamentData(): { success: boolean; database: DatabaseSchema } {
  inMemoryDb = JSON.parse(JSON.stringify(initialDatabase));
  saveDatabase(inMemoryDb!);
  return { success: true, database: inMemoryDb! };
}
