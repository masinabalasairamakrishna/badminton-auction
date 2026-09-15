"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  Download,
  Search,
  Trophy,
  Filter,
  Eye,
  Radio,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { DatabaseSchema, Player } from "@/types";
import { useToast } from "@/components/Toast";
import PlayerCardModal from "@/components/PlayerCardModal";
import PlayerAvatar from "@/components/PlayerAvatar";
import { formatCurrency } from "@/lib/utils";

export default function AuctionResultsPage() {
  const { info } = useToast();
  const [db, setDb] = useState<DatabaseSchema | null>(null);
  const [activeTab, setActiveTab] = useState<"sold" | "unsold">("sold");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  useEffect(() => {
    fetch("/api/auction/state")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setDb(json.data);
        }
      });
  }, []);

  if (!db) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh] text-emerald-400 font-bold animate-pulse">
          Loading Auction Results...
        </div>
      </DashboardLayout>
    );
  }

  const { players, teams, settings } = db;
  const currency = settings.currency || "coins";

  const soldPlayers = players.filter((p) => p.status === "Sold");
  const unsoldPlayers = players.filter((p) => p.status === "Unsold");
  const totalPurseSpent = soldPlayers.reduce((acc, p) => acc + (p.finalPrice || 0), 0);

  const displayedList = (activeTab === "sold" ? soldPlayers : unsoldPlayers).filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.branch.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.soldToTeamName && p.soldToTeamName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const exportResultsCSV = () => {
    const list = activeTab === "sold" ? soldPlayers : unsoldPlayers;
    if (list.length === 0) return;

    let headers = "";
    let rows: string[] = [];

    if (activeTab === "sold") {
      headers = "Player Name,Roll Number,Branch,Year,Playing Type,Skill Level,Sold To,Final Price";
      rows = list.map(
        (p) =>
          `"${p.name}","${p.rollNumber}","${p.branch}","${p.year}","${p.playingType}","${p.skillLevel}","${p.soldToTeamName || ""}",${p.finalPrice || 0}`
      );
    } else {
      headers = "Player Name,Roll Number,Branch,Year,Playing Type,Skill Level,Base Price,Status";
      rows = list.map(
        (p) =>
          `"${p.name}","${p.rollNumber}","${p.branch}","${p.year}","${p.playingType}","${p.skillLevel}",${p.basePrice},"Unsold"`
      );
    }

    const blob = new Blob([[headers, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `badminton_auction_${activeTab}_players_${Date.now()}.csv`;
    a.click();
    info(`Exported ${activeTab} players to CSV`);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Official Auction Results</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Hostel Day 2026
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Comprehensive breakdown of all sold franchise acquisitions and unsold player listings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportResultsCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export {activeTab === "sold" ? "Sold" : "Unsold"} CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card-glass rounded-2xl p-4 border border-emerald-500/30 bg-emerald-950/10">
          <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400 block mb-1">
            Sold Players
          </span>
          <span className="text-3xl font-black text-white">{soldPlayers.length}</span>
          <span className="text-[11px] text-slate-400 block mt-1">Acquired into team squads</span>
        </div>

        <div className="card-glass rounded-2xl p-4 border border-rose-500/30 bg-rose-950/10">
          <span className="text-xs uppercase font-extrabold tracking-wider text-rose-400 block mb-1">
            Unsold Players
          </span>
          <span className="text-3xl font-black text-white">{unsoldPlayers.length}</span>
          <span className="text-[11px] text-slate-400 block mt-1">Available for re-auction</span>
        </div>

        <div className="card-glass rounded-2xl p-4 border border-amber-500/30 bg-amber-950/10">
          <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400 block mb-1">
            Total Hammer Volume
          </span>
          <span className="text-3xl font-black text-amber-400">
            {formatCurrency(totalPurseSpent, currency)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Total spend across 6 teams</span>
        </div>
      </div>

      {/* Tab Navigation & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("sold")}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              activeTab === "sold"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sold Players ({soldPlayers.length})
          </button>
          <button
            onClick={() => setActiveTab("unsold")}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              activeTab === "unsold"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Unsold Players ({unsoldPlayers.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search results..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-emerald-400"
          />
        </div>
      </div>

      {/* Results Table */}
      <div className="card-glass rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        {displayedList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No {activeTab} players found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 bg-slate-900/70">
                <tr>
                  <th className="py-3.5 px-4 font-extrabold">#</th>
                  <th className="py-3.5 px-4 font-extrabold">Player</th>
                  <th className="py-3.5 px-4 font-extrabold">Branch / Year</th>
                  <th className="py-3.5 px-4 font-extrabold">Type / Skill</th>
                  {activeTab === "sold" ? (
                    <>
                      <th className="py-3.5 px-4 font-extrabold">Franchise Team</th>
                      <th className="py-3.5 px-4 font-extrabold text-right">Final Bid</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3.5 px-4 font-extrabold text-right">Base Price</th>
                      <th className="py-3.5 px-4 font-extrabold text-center">Status</th>
                    </>
                  )}
                  <th className="py-3.5 px-4 font-extrabold text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayedList.map((player, idx) => (
                  <tr key={player.id} className="hover:bg-slate-800/30 transition text-xs">
                    <td className="py-3 px-4 font-mono text-slate-500">{idx + 1}</td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <PlayerAvatar
                          photo={player.photo}
                          name={player.name}
                          size="sm"
                        />
                        <div>
                          <span className="font-extrabold text-white text-sm block">{player.name}</span>
                          <span className="text-[11px] font-mono text-slate-400">{player.rollNumber}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-200">{player.branch}</span>
                      <span className="text-slate-400 ml-1.5">• {player.year} Year</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-sky-400">{player.playingType}</span>
                      <span className="text-slate-400 ml-1.5">• {player.skillLevel}</span>
                    </td>

                    {activeTab === "sold" ? (
                      <>
                        <td className="py-3 px-4">
                          <span className="font-black text-white text-sm">
                            {player.soldToTeamName}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-amber-400 text-sm">
                          {formatCurrency(player.finalPrice, currency)}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-300">
                          {formatCurrency(player.basePrice, currency)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            player.unsoldRound === 1
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                              : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                          }`}>
                            {player.unsoldRound === 1 ? "Round 2 Pending" : "Unsold"}
                          </span>
                        </td>
                      </>
                    )}

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedPlayer(player)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PlayerCardModal
        player={selectedPlayer}
        teams={teams}
        bids={db.bids}
        onClose={() => setSelectedPlayer(null)}
      />
    </DashboardLayout>
  );
}
