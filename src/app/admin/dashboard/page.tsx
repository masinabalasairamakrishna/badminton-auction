"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
  IndianRupee,
  Radio,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Settings,
  Sparkles,
  History,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { DatabaseSchema } from "@/types";
import { formatCurrency } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [db, setDb] = useState<DatabaseSchema | null>(null);

  useEffect(() => {
    fetch("/api/auction/state")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setDb(json.data);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  if (!db) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-emerald-400 text-lg font-bold animate-pulse flex items-center gap-2">
            <span>🏸</span>
            <span>Loading Dashboard Analytics...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { players, teams, settings, auctionHistory, auctionState } = db;
  const currency = settings.currency || "coins";

  const totalPlayers = players.length;
  const soldPlayers = players.filter((p) => p.status === "Sold").length;
  const unsoldPlayers = players.filter((p) => p.status === "Unsold").length;
  const remainingPlayers = players.filter((p) => p.status === "Available" || p.status === "Live").length;
  const totalTeams = teams.length;
  const totalSpent = teams.reduce((acc, t) => acc + t.spent, 0);

  const stats = [
    {
      label: "TOTAL PLAYERS",
      value: totalPlayers,
      subtext: "Registered for tournament",
      icon: Users,
      color: "text-sky-400",
      bg: "bg-sky-500/10 border-sky-500/30",
    },
    {
      label: "SOLD",
      value: soldPlayers,
      subtext: "Acquired by teams",
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/30",
    },
    {
      label: "UNSOLD",
      value: unsoldPlayers,
      subtext: "Passed or skipped",
      icon: XCircle,
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/30",
    },
    {
      label: "REMAINING",
      value: remainingPlayers,
      subtext: "Awaiting auction",
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/30",
    },
    {
      label: "TEAMS",
      value: totalTeams,
      subtext: "Active franchises",
      icon: Trophy,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/30",
    },
    {
      label: "TOTAL SPENT",
      value: formatCurrency(totalSpent, currency),
      subtext: "Purse allocated",
      icon: IndianRupee,
      color: "text-teal-400",
      bg: "bg-teal-500/10 border-teal-500/30",
    },
  ];

  return (
    <DashboardLayout>
      {/* Top Welcome & Quick Live Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Admin Control Dashboard</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Tournament 2026
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time analytics, franchise budget meters, and player auction controls.
          </p>
        </div>

        {/* Live Arena Quick Button */}
        <Link
          href="/admin/live"
          className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:brightness-110 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition active:scale-98"
        >
          <Radio className="w-4 h-4 animate-pulse" />
          <span>Launch Live Auction Arena</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 6 Core Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 mb-8">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border backdrop-blur-md flex flex-col justify-between transition hover:-translate-y-1 ${item.bg}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase font-black tracking-wider text-slate-400">
                  {item.label}
                </span>
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <div className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {item.value}
              </div>
              <span className="text-[10px] text-slate-400 mt-1">{item.subtext}</span>
            </div>
          );
        })}
      </div>

      {/* Team Budget Overview & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        
        {/* Teams Budget Purses */}
        <div className="lg:col-span-8 card-glass rounded-3xl p-6 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>Team Purse Utilization</span>
              </h2>
              <p className="text-xs text-slate-400">
                Remaining budget and squad count for each franchise
              </p>
            </div>
            <Link
              href="/admin/teams"
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>Manage Teams</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {teams.map((team) => {
              const percent = Math.min(100, Math.round((team.spent / team.initialBudget) * 100));
              return (
                <div
                  key={team.id}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{team.logo || "🏸"}</span>
                      <div>
                        <span
                          className="font-extrabold text-sm text-white block"
                          style={{ color: team.color }}
                        >
                          {team.name}
                        </span>
                        <span className="text-[11px] text-slate-400">Captain: {team.captain}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Spent</span>
                        <span className="font-bold text-amber-400">
                          {formatCurrency(team.spent, currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Remaining</span>
                        <span className="font-bold text-emerald-400">
                          {formatCurrency(team.remainingBudget, currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Squad</span>
                        <span className="font-bold text-slate-200">
                          {team.players.length} Players
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 to-amber-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Management Shortcuts & Live Status */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Live Status Widget */}
          <div className="card-glass rounded-3xl p-5 border border-slate-800">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 block mb-2">
              Auction Engine Status
            </span>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      auctionState.status === "LIVE" ? "bg-red-400" : "bg-emerald-400"
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-3 w-3 ${
                      auctionState.status === "LIVE" ? "bg-red-500" : "bg-emerald-500"
                    }`}
                  />
                </span>
                <div>
                  <span className="text-sm font-black text-white block">
                    {auctionState.status}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {auctionState.lastAction || "Awaiting action"}
                  </span>
                </div>
              </div>
              <Link
                href="/admin/live"
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
              >
                Join
              </Link>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="card-glass rounded-3xl p-5 border border-slate-800 flex-1">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 block mb-3">
              Quick Admin Actions
            </span>

            <div className="grid grid-cols-1 gap-2.5">
              <Link
                href="/admin/players"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 text-sm font-semibold text-slate-200 hover:text-white transition"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-sky-400" />
                  <span>Register & Manage Players</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </Link>

              <Link
                href="/admin/players?action=sync"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 text-sm font-semibold text-slate-200 hover:text-white transition"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Sync from Google Sheets</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </Link>

              <Link
                href="/admin/queue"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 text-sm font-semibold text-slate-200 hover:text-white transition"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Reorder Auction Queue</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </Link>

              <Link
                href="/results"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 text-sm font-semibold text-slate-200 hover:text-white transition"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span>Export Final Results</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </Link>

              <Link
                href="/admin/settings"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 text-sm font-semibold text-slate-200 hover:text-white transition"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Tournament Settings</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sold/Unsold Activity Feed */}
      <div className="card-glass rounded-3xl p-6 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <History className="w-5 h-5 text-sky-400" />
            <span>Recent Auction Transactions ({auctionHistory.length})</span>
          </h2>
          <Link
            href="/admin/history"
            className="text-xs font-bold text-sky-400 hover:text-sky-300"
          >
            View Complete History
          </Link>
        </div>

        {auctionHistory.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No players have been auctioned yet. Start bidding from the Live Arena!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-3 font-extrabold">Player</th>
                  <th className="pb-3 font-extrabold">Status</th>
                  <th className="pb-3 font-extrabold">Franchise</th>
                  <th className="pb-3 font-extrabold text-right">Price</th>
                  <th className="pb-3 font-extrabold text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auctionHistory.slice(0, 5).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 font-bold text-white">{item.playerName}</td>
                    <td className="py-3">
                      <span
                        className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                          item.status === "Sold"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-slate-300">
                      {item.teamName || "—"}
                    </td>
                    <td className="py-3 text-right font-mono font-black text-amber-400">
                      {formatCurrency(item.finalPrice, currency)}
                    </td>
                    <td className="py-3 text-right text-xs text-slate-400 font-mono">
                      {item.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
