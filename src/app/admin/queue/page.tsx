"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ListOrdered,
  ArrowUp,
  ArrowDown,
  Play,
  CheckCircle2,
  Radio,
  Clock,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { DatabaseSchema, Player } from "@/types";
import { useToast } from "@/components/Toast";
import { formatCurrency } from "@/lib/utils";
import PlayerAvatar from "@/components/PlayerAvatar";

export default function AuctionQueuePage() {
  const { success, error } = useToast();
  const [db, setDb] = useState<DatabaseSchema | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auction/state");
      const json = await res.json();
      if (json.success && json.data) {
        setDb(json.data);
      }
    } catch {
      error("Failed to load queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartPlayer = async (playerId: string) => {
    try {
      const res = await fetch("/api/auction/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "START", playerId }),
      });
      const data = await res.json();
      if (data.success) {
        success("Player put ON THE HAMMER!");
        loadData();
      } else {
        error(data.message || "Failed to start auction for player.");
      }
    } catch {
      error("Error starting auction");
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    if (!db) return;
    const available = [...db.players.filter((p) => p.status === "Available")].sort(
      (a, b) => a.queueOrder - b.queueOrder
    );

    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= available.length) return;

    // Swap queueOrder
    const currentOrder = available[index].queueOrder;
    const targetOrder = available[targetIdx].queueOrder;

    try {
      await fetch("/api/players", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...available[index], queueOrder: targetOrder }),
      });
      await fetch("/api/players", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...available[targetIdx], queueOrder: currentOrder }),
      });

      loadData();
      success("Queue order updated.");
    } catch {
      error("Error reordering queue.");
    }
  };

  if (!db) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh] text-emerald-400 font-bold animate-pulse">
          Loading Auction Queue...
        </div>
      </DashboardLayout>
    );
  }

  const { players, auctionState, settings } = db;
  const currency = settings.currency || "coins";

  const livePlayer = players.find((p) => p.id === auctionState.currentPlayerId);
  const availableQueue = players
    .filter((p) => p.status === "Available" && (!p.round || p.round === 1) && p.id !== auctionState.currentPlayerId)
    .sort((a, b) => a.queueOrder - b.queueOrder);
  const round2Queue = players
    .filter((p) => p.status === "Unsold" && p.unsoldRound === 1 && p.id !== auctionState.currentPlayerId)
    .sort((a, b) => a.queueOrder - b.queueOrder);
  const completedPlayers = players.filter(
    (p) => p.status === "Sold" || (p.status === "Unsold" && p.unsoldRound === 2)
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Auction Queue & Lineup</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {availableQueue.length} In Queue
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Arrange player bidding order or immediately call any player to the live hammer.
          </p>
        </div>

        <Link
          href="/admin/live"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"
        >
          <Radio className="w-4 h-4 animate-pulse" />
          <span>Live Arena</span>
        </Link>
      </div>

      {/* NOW LIVE HIGHLIGHT CARD */}
      <div className="card-glass rounded-3xl p-6 border-2 border-red-500/40 bg-gradient-to-br from-red-950/20 via-slate-900 to-slate-950 mb-8 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            <span className="text-xs uppercase font-black tracking-wider text-red-400">
              Currently On The Hammer (NOW LIVE)
            </span>
          </div>

          {livePlayer && (
            <span className="text-xs font-mono text-slate-400">Order #{livePlayer.queueOrder}</span>
          )}
        </div>

        {livePlayer ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 border-2 border-emerald-400 flex-shrink-0 shadow-lg">
                {livePlayer.photo ? (
                  <img src={livePlayer.photo} alt={livePlayer.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl flex items-center justify-center h-full">🏸</span>
                )}
              </div>
              <div>
                <h3 className="text-xl font-black text-white">{livePlayer.name}</h3>
                <span className="text-xs font-mono text-emerald-400">
                  {livePlayer.rollNumber} • {livePlayer.branch} • {livePlayer.year} Year
                </span>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <span className="text-sky-400 font-bold">{livePlayer.playingType}</span>
                  <span>•</span>
                  <span className="text-amber-400 font-bold">Base: {formatCurrency(livePlayer.basePrice, currency)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admin/live"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-500/25 flex items-center gap-2"
              >
                <span>Jump To Live Bidding</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 text-sm italic">
            No player is currently live. Select a player below to start the bidding!
          </div>
        )}
      </div>

      {/* UPCOMING QUEUE LIST */}
      <div className="card-glass rounded-3xl p-6 border border-slate-800 shadow-xl mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-amber-400" />
            <span>Upcoming Lineup Order</span>
          </h2>
          <span className="text-xs text-slate-400">Use arrows to reorder lineup</span>
        </div>

        {availableQueue.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            All players have been auctioned! Check the Results tab.
          </div>
        ) : (
          <div className="space-y-2">
            {availableQueue.map((player, idx) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-slate-700 transition text-xs"
              >
                <div className="flex items-center gap-3.5">
                  <span className="font-mono font-black text-slate-500 w-6 text-center">
                    #{idx + 1}
                  </span>

                  <PlayerAvatar
                    photo={player.photo}
                    name={player.name}
                    size="sm"
                  />

                  <div>
                    <span className="font-extrabold text-sm text-white block">{player.name}</span>
                    <span className="text-[11px] text-slate-400">
                      {player.branch} ({player.year} Year) • {player.playingType} • {player.skillLevel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-amber-400 text-sm">
                    {formatCurrency(player.basePrice, currency)}
                  </span>

                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMove(idx, "up")}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition"
                      title="Move Earlier in Queue"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(idx, "down")}
                      disabled={idx === availableQueue.length - 1}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition"
                      title="Move Later in Queue"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Put Live Button */}
                  <button
                    onClick={() => handleStartPlayer(player.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 font-bold flex items-center gap-1.5 transition"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Call Live</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ROUND 2 LINEUP (UNSOLD PLAYERS - SECOND CHANCE) */}
      <div className="card-glass rounded-3xl p-6 border-2 border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-950 mb-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Round 2 Lineup • Unsold Players</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {round2Queue.length} Second Chance
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Players who went unsold in Round 1. When Round 1 finishes or when called, they take the hammer for Round 2!
              </p>
            </div>
          </div>
        </div>

        {round2Queue.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
            No players currently in Round 2 queue. Any players marked UNSOLD during Round 1 will automatically appear here!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {round2Queue.map((player) => (
              <div
                key={player.id}
                className="p-3.5 rounded-2xl bg-slate-900/80 border border-amber-500/30 flex items-center justify-between gap-3 hover:border-amber-500/50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="font-mono text-xs font-bold text-amber-400 w-7">
                    #{player.queueOrder}
                  </div>
                  <PlayerAvatar photo={player.photo} name={player.name} size="sm" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-sm">{player.name}</span>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        ROUND 2
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 block">
                      {player.branch} • {player.playingType} • {formatCurrency(player.basePrice, currency)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleStartPlayer(player.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 whitespace-nowrap"
                  title={`Call ${player.name} to the hammer for Round 2`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Call to R2 Hammer</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* COMPLETED PLAYERS LIST */}
      <div className="card-glass rounded-3xl p-6 border border-slate-800 shadow-xl">
        <h2 className="text-lg font-black text-white flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Completed Player Auctions ({completedPlayers.length})</span>
        </h2>

        {completedPlayers.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            No players completed yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {completedPlayers.map((player) => (
              <div
                key={player.id}
                className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-white block">{player.name}</span>
                  <span className="text-[11px] text-slate-400">{player.branch} • {player.soldToTeamName || "Unsold"}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                    player.status === "Sold"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-rose-500/20 text-rose-400"
                  }`}
                >
                  {player.status === "Sold" ? formatCurrency(player.finalPrice, currency) : "Unsold"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
