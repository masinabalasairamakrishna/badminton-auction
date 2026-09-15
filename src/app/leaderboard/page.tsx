"use client";

import React, { useState, useEffect } from "react";
import { Medal, Trophy, ArrowUpDown, Users, IndianRupee, Wallet } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { DatabaseSchema, Team } from "@/types";
import { formatCurrency } from "@/lib/utils";

export default function LeaderboardPage() {
  const [db, setDb] = useState<DatabaseSchema | null>(null);
  const [sortBy, setSortBy] = useState<"players" | "spent" | "remaining">("players");

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
          Loading Tournament Standings...
        </div>
      </DashboardLayout>
    );
  }

  const { teams, players, settings } = db;
  const currency = settings.currency || "coins";

  const sortedTeams = [...teams].sort((a, b) => {
    if (sortBy === "players") {
      if (b.players.length !== a.players.length) {
        return b.players.length - a.players.length;
      }
      return b.spent - a.spent;
    }
    if (sortBy === "spent") return b.spent - a.spent;
    if (sortBy === "remaining") return b.remainingBudget - a.remainingBudget;
    return 0;
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Franchise Leaderboard</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Rankings
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Compare team squads, capital deployment, and purse availability in real time.
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-2xl">
          <button
            onClick={() => setSortBy("players")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              sortBy === "players"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Most Players
          </button>
          <button
            onClick={() => setSortBy("spent")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              sortBy === "spent"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Highest Spending
          </button>
          <button
            onClick={() => setSortBy("remaining")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              sortBy === "remaining"
                ? "bg-sky-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Highest Remaining
          </button>
        </div>
      </div>

      {/* Top 3 Podium Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {sortedTeams.slice(0, 3).map((team, idx) => {
          let rankColor = "border-amber-400 bg-amber-500/10 text-amber-400";
          let medalEmoji = "🥇";
          if (idx === 1) {
            rankColor = "border-slate-300 bg-slate-300/10 text-slate-300";
            medalEmoji = "🥈";
          } else if (idx === 2) {
            rankColor = "border-amber-700 bg-amber-700/10 text-amber-600";
            medalEmoji = "🥉";
          }

          return (
            <div
              key={team.id}
              className={`card-glass rounded-3xl p-6 border shadow-xl flex flex-col justify-between relative overflow-hidden ${rankColor}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl">
                    {team.logo || "🏸"}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">{team.name}</h3>
                    <span className="text-xs text-slate-400">Capt. {team.captain}</span>
                  </div>
                </div>
                <span className="text-3xl">{medalEmoji}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Squad</span>
                  <span className="font-bold text-white text-sm">{team.players.length}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Spent</span>
                  <span className="font-bold text-amber-400 text-sm">
                    {formatCurrency(team.spent, currency)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Remaining</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {formatCurrency(team.remainingBudget, currency)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Leaderboard Table */}
      <div className="card-glass rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 bg-slate-900/70">
              <tr>
                <th className="py-3.5 px-4 font-extrabold text-center w-16">Rank</th>
                <th className="py-3.5 px-4 font-extrabold">Franchise Team</th>
                <th className="py-3.5 px-4 font-extrabold">Captain</th>
                <th className="py-3.5 px-4 font-extrabold text-center">Players Acquired</th>
                <th className="py-3.5 px-4 font-extrabold text-right">Spent Budget</th>
                <th className="py-3.5 px-4 font-extrabold text-right">Remaining Budget</th>
                <th className="py-3.5 px-4 font-extrabold text-right">Avg / Player</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedTeams.map((team, idx) => {
                const avgPrice =
                  team.players.length > 0 ? Math.round(team.spent / team.players.length) : 0;

                return (
                  <tr key={team.id} className="hover:bg-slate-800/30 transition text-xs">
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl font-mono font-black text-sm bg-slate-800 border border-slate-700 text-slate-200">
                        {idx + 1}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{team.logo || "🏸"}</span>
                        <div>
                          <span
                            className="font-black text-sm text-white block"
                            style={{ color: team.color }}
                          >
                            {team.name}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-300 font-semibold">{team.captain}</td>

                    <td className="py-4 px-4 text-center">
                      <span className="px-3 py-1 rounded-full bg-slate-800 text-white font-mono font-bold text-xs border border-slate-700">
                        {team.players.length} Players
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right font-mono font-bold text-amber-400 text-sm">
                      {formatCurrency(team.spent, currency)}
                    </td>

                    <td className="py-4 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                      {formatCurrency(team.remainingBudget, currency)}
                    </td>

                    <td className="py-4 px-4 text-right font-mono text-slate-400">
                      {avgPrice > 0 ? formatCurrency(avgPrice, currency) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
