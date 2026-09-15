"use client";

import React from "react";
import { X, Shield, Award, User, Clock, IndianRupee } from "lucide-react";
import { Player, Team, Bid } from "@/types";
import { formatCurrency } from "@/lib/utils";
import PlayerAvatar from "@/components/PlayerAvatar";

interface PlayerModalProps {
  player: Player | null;
  teams?: Team[];
  bids?: Bid[];
  currency?: string;
  onClose: () => void;
  onStartAuction?: (player: Player) => void;
  isAdmin?: boolean;
}

export default function PlayerCardModal({
  player,
  teams = [],
  bids = [],
  currency = "coins",
  onClose,
  onStartAuction,
  isAdmin = false,
}: PlayerModalProps) {
  if (!player) return null;

  const soldTeam = teams.find((t) => t.id === player.soldTo);
  const playerBids = bids.filter((b) => b.playerId === player.id);

  let statusBadge = "bg-slate-700 text-slate-200";
  if (player.status === "Available") statusBadge = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
  else if (player.status === "Live") statusBadge = "bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse";
  else if (player.status === "Sold") statusBadge = "bg-teal-500/20 text-teal-400 border border-teal-500/40";
  else if (player.status === "Unsold") statusBadge = "bg-rose-500/20 text-rose-400 border border-rose-500/40";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/70 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header & Photo */}
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-800">
          <PlayerAvatar
            photo={player.photo}
            name={player.name}
            size="lg"
            editable={isAdmin}
            playerId={player.id}
          />

          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusBadge}`}>
                {player.status}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                Order #{player.queueOrder}
              </span>
            </div>

            <h2 className="text-2xl font-black text-white">{player.name}</h2>
            <p className="text-sm font-mono text-slate-400">Roll: {player.rollNumber}</p>
          </div>
        </div>

        {/* Player Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-5">
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/40">
            <span className="text-xs text-slate-400 block mb-0.5">Branch</span>
            <span className="text-sm font-bold text-slate-200">{player.branch}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/40">
            <span className="text-xs text-slate-400 block mb-0.5">Year</span>
            <span className="text-sm font-bold text-slate-200">{player.year} Year</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/40">
            <span className="text-xs text-slate-400 block mb-0.5">Gender</span>
            <span className="text-sm font-bold text-slate-200">{player.gender}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/40">
            <span className="text-xs text-slate-400 block mb-0.5">Playing Type</span>
            <span className="text-sm font-bold text-sky-400">{player.playingType}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/40">
            <span className="text-xs text-slate-400 block mb-0.5">Skill Level</span>
            <span className="text-sm font-bold text-emerald-400">{player.skillLevel}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/40">
            <span className="text-xs text-slate-400 block mb-0.5">Base Price</span>
            <span className="text-sm font-black text-amber-400">{formatCurrency(player.basePrice, currency)}</span>
          </div>
        </div>

        {/* Notes if any */}
        {player.notes && (
          <div className="p-3 mb-4 rounded-xl bg-slate-800/30 border border-slate-800 text-xs text-slate-300 italic">
            &ldquo;{player.notes}&rdquo;
          </div>
        )}

        {/* Sold Information if Sold */}
        {player.status === "Sold" && (
          <div className="p-4 mb-4 rounded-2xl bg-teal-950/40 border border-teal-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{soldTeam?.logo || "🏸"}</span>
              <div>
                <span className="text-xs text-teal-300 uppercase tracking-wider block font-semibold">Acquired by</span>
                <span className="text-base font-extrabold text-white">{player.soldToTeamName || soldTeam?.name}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Final Price</span>
              <span className="text-xl font-black text-amber-400">{formatCurrency(player.finalPrice, currency)}</span>
            </div>
          </div>
        )}

        {/* Bidding History for this Player */}
        <div className="flex-1 overflow-y-auto mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Auction Bid History ({playerBids.length})</span>
          </h3>

          {playerBids.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
              No bids recorded for this player yet.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {playerBids.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.teamColor || "#10b981" }} />
                    <span className="font-semibold text-slate-200">{b.teamName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-amber-400">{formatCurrency(b.amount, currency)}</span>
                    <span className="text-slate-500">{b.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin Action Button */}
        {isAdmin && player.status !== "Sold" && onStartAuction && (
          <button
            onClick={() => {
              onStartAuction(player);
              onClose();
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-98"
          >
            <span>Start Live Auction For {player.name}</span>
          </button>
        )}
      </div>
    </div>
  );
}
