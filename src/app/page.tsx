import Link from "next/link";
import { Radio, ShieldCheck, Trophy, Users, Zap, ExternalLink, ArrowRight, Activity } from "lucide-react";
import { getDatabase } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = getDatabase();
  const currency = db.settings?.currency || "coins";
  const defaultBudget = db.teams[0]?.initialBudget || 1000;
  const totalPlayers = db.players.length;
  const soldPlayers = db.players.filter((p) => p.status === "Sold").length;
  const totalTeams = db.teams.length;
  const totalSpent = db.teams.reduce((acc, t) => acc + t.spent, 0);
  const isLive = db.auctionState.status === "LIVE";

  return (
    <main className="min-h-screen bg-[#070d15] text-slate-100 court-bg relative overflow-hidden flex flex-col justify-between">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-emerald-500/15 via-teal-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top mini header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20">
            🏸
          </div>
          <div>
            <span className="font-extrabold text-sm md:text-base tracking-wide text-white block">
              Hostel Day Sports 2026
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold">
              Hostel Council Official
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-xs md:text-sm font-bold text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700/80 hover:bg-slate-800 transition"
          >
            Admin Login
          </Link>
          <Link
            href="/admin/live"
            className="px-4 py-2 rounded-xl text-xs md:text-sm font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Watch Live</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-12 text-center flex-1 flex flex-col items-center justify-center">
        {/* Subtitle pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs md:text-sm font-bold mb-6">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLive ? "bg-red-400" : "bg-emerald-400"} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? "bg-red-500" : "bg-emerald-500"}`}></span>
          </span>
          <span>Hostel Day Celebration • Live Player Auction</span>
        </div>

        {/* Big Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white mb-4 leading-tight">
          🏸 BADMINTON TOURNAMENT
          <span className="block mt-2 bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400 bg-clip-text text-transparent drop-shadow-sm">
            LIVE PLAYER AUCTION
          </span>
          <span className="block text-2xl sm:text-4xl text-slate-400 font-bold mt-2">
            2026
          </span>
        </h1>

        <p className="max-w-2xl text-base sm:text-lg text-slate-300 mb-10 leading-relaxed">
          The ultimate college hostel badminton showdown. 6 powerhouse teams, fierce bidding battles, and full real-time stadium broadcast on the big screen!
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-center mb-16">
          <Link
            href="/admin/live"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-slate-950 font-black text-lg tracking-wide hover:brightness-110 transition shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-3 transform active:scale-95 group"
          >
            <Radio className="w-5 h-5 text-slate-950 animate-pulse" />
            <span>ENTER AUCTION ARENA</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-800/90 hover:bg-slate-800 text-white font-bold text-lg border border-slate-700/90 transition flex items-center justify-center gap-2 shadow-xl"
          >
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span>ADMIN CONSOLE</span>
          </Link>
        </div>

        {/* Quick Tournament Statistics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-4xl">
          <div className="card-glass p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-1">
              Registered Players
            </span>
            <span className="text-3xl font-black text-white">{totalPlayers}</span>
            <span className="text-[11px] text-emerald-400 block mt-1">{soldPlayers} Sold</span>
          </div>

          <div className="card-glass p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-1">
              Franchise Teams
            </span>
            <span className="text-3xl font-black text-amber-400">{totalTeams}</span>
            <span className="text-[11px] text-slate-400 block mt-1">{formatCurrency(defaultBudget, currency)} Cap Each</span>
          </div>

          <div className="card-glass p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-1">
              Total Spent
            </span>
            <span className="text-3xl font-black text-emerald-400">
              {formatCurrency(totalSpent, currency)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">Hostel Day Purse</span>
          </div>

          <div className="card-glass p-4 rounded-2xl border border-slate-800 text-center">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-1">
              Live Arena
            </span>
            <span className="text-3xl font-black text-sky-400">
              {isLive ? "ACTIVE" : "READY"}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">Projector Enabled</span>
          </div>
        </div>
      </section>

      {/* Teams Showcase Strip */}
      <section className="relative z-10 max-w-6xl mx-auto w-full px-6 py-8 border-t border-slate-800/80">
        <div className="text-center mb-6">
          <span className="text-xs uppercase font-bold tracking-widest text-slate-400">
            Official Tournament Teams
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {db.teams.map((t) => (
            <div
              key={t.id}
              className="card-glass p-3.5 rounded-xl border border-slate-800/80 text-center flex flex-col items-center hover:border-slate-700 transition"
            >
              <span className="text-2xl mb-1">{t.logo || "🏸"}</span>
              <span className="text-sm font-bold text-white truncate w-full">{t.name}</span>
              <span className="text-[11px] text-slate-400 mt-0.5">{formatCurrency(t.remainingBudget, currency)} left</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 py-6 text-center text-xs text-slate-400">
        Hostel Day Badminton Auction 2026 • Built for Live College Tournament Celebrations
      </footer>
    </main>
  );
}
