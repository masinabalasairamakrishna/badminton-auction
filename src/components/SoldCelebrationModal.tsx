"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { Award, ArrowRight, X } from "lucide-react";
import { soundManager } from "@/lib/audio";
import { Player, Team } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface SoldModalProps {
  isOpen: boolean;
  player: Player | null;
  team: Team | null;
  finalPrice: number;
  currency?: string;
  onClose: () => void;
  onNextPlayer?: () => void;
}

export default function SoldCelebrationModal({
  isOpen,
  player,
  team,
  finalPrice,
  currency = "coins",
  onClose,
  onNextPlayer,
}: SoldModalProps) {
  useEffect(() => {
    if (isOpen) {
      soundManager.playSoldFanfare();

      // Trigger Confetti explosion
      const duration = 3.5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const interval: NodeJS.Timeout = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: 0.15, y: Math.random() - 0.2 },
          colors: ["#f59e0b", "#10b981", "#38bdf8", "#ec4899", "#ffffff"],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: 0.85, y: Math.random() - 0.2 },
          colors: ["#f59e0b", "#10b981", "#38bdf8", "#ec4899", "#ffffff"],
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen || !player || !team) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-[#0d1825] to-slate-950 border-2 border-amber-500/50 rounded-3xl p-8 shadow-2xl text-center overflow-hidden stadium-glow animate-in zoom-in-95 duration-300">
        {/* Background decorative glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Big Celebration Header */}
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-extrabold text-lg md:text-xl tracking-wider uppercase mb-6 animate-pulse">
          <span>🏸</span>
          <span>🎉 SOLD! SOLD! SOLD! 🎉</span>
          <span>🏸</span>
        </div>

        {/* Player Photo & Details */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-amber-400 shadow-2xl bg-slate-800">
              {player.photo ? (
                <img
                  src={player.photo}
                  alt={player.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = "flex";
                  }}
                  className="w-full h-full object-cover"
                />
              ) : null}
              <div
                style={{ display: player.photo ? "none" : "flex" }}
                className="w-full h-full items-center justify-center text-5xl bg-slate-800"
              >
                🏸
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 p-2 rounded-full shadow-lg font-bold">
              <Award className="w-6 h-6" />
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-1">
            {player.name}
          </h2>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span className="font-semibold text-emerald-400">{player.branch}</span>
            <span>•</span>
            <span>{player.year} Year</span>
            <span>•</span>
            <span className="text-sky-400">{player.playingType}</span>
          </div>
        </div>

        {/* Team Banner & Final Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl mb-8">
          <div className="flex flex-col items-center justify-center p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">
              Sold To
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{team.logo || "🏸"}</span>
              <span
                className="text-xl md:text-2xl font-black tracking-wide"
                style={{ color: team.color || "#f59e0b" }}
              >
                {team.name}
              </span>
            </div>
            <span className="text-xs text-slate-400 mt-1">Captain: {team.captain}</span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-amber-950/40 to-amber-900/20 border border-amber-500/30 rounded-xl">
            <span className="text-xs uppercase tracking-wider font-semibold text-amber-300 mb-1">
              Final Hammer Price
            </span>
            <span className="text-3xl md:text-4xl font-black text-amber-400 drop-shadow-md">
              {formatCurrency(finalPrice, currency)}
            </span>
            <span className="text-xs text-slate-400 mt-1">Base Price: {formatCurrency(player.basePrice, currency)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold transition"
          >
            Review Board
          </button>
          {onNextPlayer && (
            <button
              onClick={onNextPlayer}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition transform active:scale-95"
            >
              <span>Next Player in Queue</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
