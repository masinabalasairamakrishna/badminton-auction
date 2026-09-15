export type PlayingType = "Singles" | "Doubles" | "Both";
export type SkillLevel = "Beginner" | "Intermediate" | "Advanced";
export type PlayerStatus = "Available" | "Live" | "Sold" | "Unsold";
export type AuctionStatus = "IDLE" | "LIVE" | "PAUSED" | "ENDED";
export type UserRole = "admin" | "captain" | "viewer";

export interface UserSession {
  role: UserRole;
  username: string;
  name: string;
  teamId?: string;
  teamName?: string;
  teamLogo?: string;
  teamColor?: string;
}

export interface Player {
  id: string;
  name: string;
  photo?: string;
  rollNumber: string;
  branch: string;
  year: string; // "1st", "2nd", "3rd", "4th"
  gender: "Male" | "Female" | "Other";
  playingType: PlayingType;
  skillLevel: SkillLevel;
  basePrice: number;
  status: PlayerStatus;
  soldTo?: string; // Team ID
  soldToTeamName?: string;
  finalPrice?: number;
  queueOrder: number;
  notes?: string;
  round?: number; // 1 or 2
  unsoldRound?: number; // 1 if unsold in round 1, 2 if unsold in round 2
}

export interface Team {
  id: string;
  name: string;
  logo?: string;
  color: string; // Tailwind accent or hex
  captain: string;
  username?: string;
  passcode?: string;
  initialBudget: number;
  remainingBudget: number;
  spent: number;
  players: string[]; // Player IDs
}

export interface Bid {
  id: string;
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  teamColor?: string;
  amount: number;
  timestamp: string; // ISO string
  adminUser?: string;
}

export interface AuctionState {
  status: AuctionStatus;
  currentPlayerId: string | null;
  currentBid: number;
  highestBidTeamId: string | null;
  highestBidTeamName: string | null;
  timerSeconds: number;
  initialTimerSeconds: number;
  selectedIncrement: number;
  lastAction?: string;
  isSoundEnabled: boolean;
  bidHistory: Bid[];
  currentRound?: number; // 1 or 2
}

export interface TournamentSettings {
  tournamentName: string;
  subtitle: string;
  currency: string;
  defaultBasePrice: number;
  auctionTimer: number;
  bidIncrements: number[];
  minSquadSize: number;
  maxSquadSize: number;
  soundEnabled: boolean;
}

export interface AuctionHistoryItem {
  id: string;
  playerId: string;
  playerName: string;
  teamId?: string;
  teamName?: string;
  finalPrice?: number;
  status: "Sold" | "Unsold";
  timestamp: string;
  totalBids: number;
}

export interface DatabaseSchema {
  settings: TournamentSettings;
  teams: Team[];
  players: Player[];
  auctionState: AuctionState;
  bids: Bid[];
  auctionHistory: AuctionHistoryItem[];
}
