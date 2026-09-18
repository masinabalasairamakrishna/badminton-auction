export interface AuctionRule {
  id: number;
  title: string;
  description: string;
  highlight?: string;
}

export const TOURNAMENT_RULES_HEADER = {
  event: "ANVAYA 2K26",
  title: "HOSTEL DAY BADMINTON AUCTION RULES",
  subtitle: "Official Tournament Rules & Regulations for Franchise Captains & Players",
  footer: "All teams and players are expected to follow the above rules throughout the auction.",
};

export const BADMINTON_AUCTION_RULES: AuctionRule[] = [
  {
    id: 1,
    title: "Team Budget",
    description: "Every team will receive the same starting budget of 1,000 coins and cannot bid beyond its remaining balance.",
    highlight: "1,000 Coins Balance",
  },
  {
    id: 2,
    title: "Base Price",
    description: "Every player will have a fixed base price (20 coins) before the auction starts.",
    highlight: "20 Coins Base",
  },
  {
    id: 3,
    title: "Bidding Increments",
    description: "Bids can be increased only by +10, +20, +50, or +100 coins, selected directly by the franchise captain.",
    highlight: "+10, +20, +50, +100",
  },
  {
    id: 4,
    title: "Bid Confirmation",
    description: "Once a bid is accepted and confirmed by the auctioneer, it cannot be withdrawn.",
  },
  {
    id: 5,
    title: "Final Call",
    description: "Once the auctioneer makes the final call (or the auction timer expires), no further bids will be accepted.",
  },
  {
    id: 6,
    title: "Player Sale",
    description: "The player will be sold to the team with the highest valid bid after the final call.",
  },
  {
    id: 7,
    title: "No-Bid Player",
    description: "If no team bids for a player at base price, the player will remain unsold.",
  },
  {
    id: 8,
    title: "Unsold Players",
    description: "Players who remain unsold in the 1st round will be brought back for bidding in the 2nd round.",
    highlight: "Round 2 Re-entry",
  },
  {
    id: 9,
    title: "Second Round",
    description: "Only players who remained unsold in the 1st round will be available in the 2nd round.",
  },
  {
    id: 10,
    title: "Unsold After Round 2",
    description: "Players who receive no bids in the 2nd round will remain permanently unsold.",
  },
  {
    id: 11,
    title: "Squad Size",
    description: "Each team must have a minimum of 6 players and a maximum of 8 players.",
    highlight: "Min 6 • Max 8 Players",
  },
  {
    id: 12,
    title: "Maximum Squad Limit",
    description: "A team that reaches 8 players cannot participate in further bidding.",
  },
  {
    id: 13,
    title: "Playing Lineup & Squad Composition",
    description: "Every team must have sufficient squad members to field Singles and Doubles ties in each tournament clash.",
  },
  {
    id: 14,
    title: "Auctioneer's Decision",
    description: "The auctioneer's decision will be final in case of any bidding dispute or rule interpretation.",
    highlight: "Final & Binding",
  },
];

export const WHATSAPP_RULES_TEXT = `*${TOURNAMENT_RULES_HEADER.event}*
*${TOURNAMENT_RULES_HEADER.title}*

${BADMINTON_AUCTION_RULES.map((r) => `*${r.id}. ${r.title}:* ${r.description}`).join("\n\n")}

_${TOURNAMENT_RULES_HEADER.footer}_`;
