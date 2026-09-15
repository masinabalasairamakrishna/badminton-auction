"use client";

import React, { useState, useEffect } from "react";
import { History, Search, Download, Trash2, Filter } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { DatabaseSchema, Bid } from "@/types";
import { useToast } from "@/components/Toast";
import { formatCurrency } from "@/lib/utils";

export default function BidHistoryPage() {
  const { info } = useToast();
  const [db, setDb] = useState<DatabaseSchema | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("All");

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
          Loading Bid Audit Logs...
        </div>
      </DashboardLayout>
    );
  }

  const { bids, teams, settings } = db;
  const currency = settings.currency || "coins";

  const filteredBids = bids.filter((b) => {
    const matchesSearch =
      b.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.teamName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeam = teamFilter === "All" || b.teamId === teamFilter;
    return matchesSearch && matchesTeam;
  });

  const exportCSV = () => {
    if (filteredBids.length === 0) return;
    const headers = ["Bid ID,Player Name,Team Name,Amount,Timestamp,Admin User"];
    const rows = filteredBids.map(
      (b) => `"${b.id}","${b.playerName}","${b.teamName}",${b.amount},"${b.timestamp}","${b.adminUser || "Admin"}"`
    );
    const blob = new Blob([[...headers, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `badminton_auction_bids_${Date.now()}.csv`;
    a.click();
    info("Downloaded Bid History CSV");
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Bid Audit Logs & History</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
              {bids.length} Total Bids
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Chronological log of every single bid placed during the tournament auction.
          </p>
        </div>

        <button
          onClick={exportCSV}
          disabled={filteredBids.length === 0}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition disabled:opacity-40"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export Bids CSV</span>
        </button>
      </div>

      {/* Search & Team Filter Bar */}
      <div className="card-glass rounded-2xl p-4 border border-slate-800 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by player or franchise team..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-emerald-400"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="w-full py-2 px-3 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-hidden focus:border-emerald-400"
          >
            <option value="All">All Franchises</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="card-glass rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        {filteredBids.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No bids found. When bids are placed in the Live Arena, they will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 bg-slate-900/70">
                <tr>
                  <th className="py-3.5 px-4 font-extrabold">#</th>
                  <th className="py-3.5 px-4 font-extrabold">Player</th>
                  <th className="py-3.5 px-4 font-extrabold">Bidding Team</th>
                  <th className="py-3.5 px-4 font-extrabold text-right">Bid Amount</th>
                  <th className="py-3.5 px-4 font-extrabold text-right">Time</th>
                  <th className="py-3.5 px-4 font-extrabold text-center">Placed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredBids.map((bid, idx) => (
                  <tr key={bid.id} className="hover:bg-slate-800/30 transition text-xs">
                    <td className="py-3 px-4 font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-white text-sm">{bid.playerName}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: bid.teamColor || "#10b981" }}
                        />
                        <span className="font-semibold text-slate-200">{bid.teamName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-amber-400 text-sm">
                      {formatCurrency(bid.amount, currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {bid.timestamp}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-bold">
                        {bid.adminUser || "Admin"}
                      </span>
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
