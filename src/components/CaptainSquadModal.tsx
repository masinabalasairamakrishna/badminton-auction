"use client";

import React from "react";
import { X, Download, Users, Trophy, Coins, Printer, Sparkles, AlertCircle } from "lucide-react";
import { Team, Player } from "@/types";
import { formatCurrency } from "@/lib/utils";
import PlayerAvatar from "@/components/PlayerAvatar";
import { downloadTeamSquadCSV } from "@/lib/exportUtils";

interface CaptainSquadModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  players?: Player[];
  currency?: string;
}

export default function CaptainSquadModal({
  isOpen,
  onClose,
  team,
  players = [],
  currency = "coins",
}: CaptainSquadModalProps) {
  if (!isOpen || !team) return null;

  const squadPlayers = players.filter(
    (p) => p.soldTo === team.id || (team.players && team.players.includes(p.id))
  );
  const minSquad = 6;
  const maxSquad = 8;
  const isFull = squadPlayers.length >= maxSquad;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-[#0c1421] border rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        style={{ borderColor: team.color ? team.color + "60" : "#334155" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="p-4 sm:p-5 border-b flex items-center justify-between gap-3"
          style={{
            backgroundColor: team.color ? team.color + "15" : "#1e293b",
            borderColor: team.color ? team.color + "40" : "#334155",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl">{team.logo || "🏸"}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  className="text-lg sm:text-xl font-black tracking-tight"
                  style={{ color: team.color || "#ffffff" }}
                >
                  {team.name}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                  Squad Roster
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Captain: <span className="text-white font-bold">{team.captain || "Franchise"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadTeamSquadCSV(team, squadPlayers, currency)}
              disabled={squadPlayers.length === 0}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Download squad roster as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Squad Summary Badges */}
        <div className="grid grid-cols-3 gap-2 p-3 sm:p-4 bg-slate-900/60 border-b border-slate-800 text-center">
          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Players Bought
            </span>
            <span className="text-base sm:text-lg font-black text-white">
              {squadPlayers.length} <span className="text-xs text-slate-400 font-normal">/ {maxSquad}</span>
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Purse Remaining
            </span>
            <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
              {formatCurrency(team.remainingBudget, currency)}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Total Spent
            </span>
            <span className="text-base sm:text-lg font-black text-amber-400 font-mono">
              {formatCurrency(team.spent, currency)}
            </span>
          </div>
        </div>

        {/* Players List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2.5">
          {squadPlayers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-2xl">
                🏸
              </div>
              <p className="text-sm font-bold text-slate-300">No players acquired yet</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Winning bids during the live auction will automatically appear here!
              </p>
            </div>
          ) : (
            squadPlayers.map((player, idx) => (
              <div
                key={player.id || idx}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-black text-slate-500 w-5 text-center flex-shrink-0">
                    #{idx + 1}
                  </span>
                  <PlayerAvatar
                    photo={player.photo}
                    name={player.name}
                    size="sm"
                    className="flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-black text-white block truncate">
                      {player.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {player.rollNumber ? player.rollNumber + " • " : ""}{player.branch} • {player.playingType} ({player.skillLevel})
                    </span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-[9px] text-slate-400 block uppercase font-semibold">Sold At</span>
                  <span className="text-xs font-mono font-black text-amber-400">
                    {formatCurrency(player.finalPrice || player.basePrice || 0, currency)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400">
            {squadPlayers.length < minSquad
              ? "Need at least " + (minSquad - squadPlayers.length) + " more player(s) for min squad."
              : isFull
              ? "Squad limit reached (8/8). Maximum capacity!"
              : (maxSquad - squadPlayers.length) + " squad spot(s) remaining."}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadTeamSquadCSV(team, squadPlayers, currency)}
              disabled={squadPlayers.length === 0}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-md shadow-emerald-500/20 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Sold Players (CSV)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
