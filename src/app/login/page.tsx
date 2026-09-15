"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Eye, Lock, User, ArrowRight, AlertCircle, CheckCircle2, Trophy, Sparkles } from "lucide-react";
import { useToast } from "@/components/Toast";
import { Team } from "@/types";

const fallbackTeams = [
  { id: "team-1", name: "Shuttle Trouble", logo: "🏸", color: "#f59e0b", captain: "Hemanth", username: "hemanth", passcode: "hemanth2026" },
  { id: "team-2", name: "Court Crushers", logo: "👑", color: "#10b981", captain: "Vara Prasad", username: "varaprasad", passcode: "prasad2026" },
  { id: "team-3", name: "Team Phonix", logo: "🥷", color: "#8b5cf6", captain: "Chitti", username: "chitti", passcode: "chitti2026" },
  { id: "team-4", name: "AERO VEX", logo: "⚡", color: "#06b6d4", captain: "Venky", username: "venky", passcode: "venky2026" },
  { id: "team-5", name: "ShuttleStorm", logo: "🛡️", color: "#ec4899", captain: "Govind Varma", username: "govind", passcode: "govind2026" },
  { id: "team-6", name: "Hit & Run", logo: "🏆", color: "#3b82f6", captain: "Surya", username: "surya", passcode: "surya2026" },
  { id: "team-1788945552104", name: "Juggernauts", logo: "🏸", color: "#6366f1", captain: "Ranjith", username: "ranjith", passcode: "ranjith2026" },
  { id: "team-1788945585159", name: "ACE Attackers", logo: "🏸", color: "#f43f5e", captain: "Manikumar", username: "manikumar", passcode: "manikumar2026" },
];

export default function LoginPage() {
  const router = useRouter();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<"captain" | "admin">("captain");
  const [teams, setTeams] = useState<typeof fallbackTeams>(fallbackTeams);

  // Captain login state
  const [selectedTeamId, setSelectedTeamId] = useState<string>("team-1");
  const [captainPasscode, setCaptainPasscode] = useState<string>("smash2026");

  // Admin login state
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("hostel2026");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetch("/api/auction/state")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data && json.data.teams?.length > 0) {
          setTeams(json.data.teams);
        }
      })
      .catch(() => {});
  }, []);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];

  const handleTeamChange = (teamId: string) => {
    setSelectedTeamId(teamId);
    const t = teams.find((item) => item.id === teamId);
    if (t) {
      setCaptainPasscode(t.passcode || `${t.username || "team"}2026`);
    }
  };

  const handleCaptainLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: selectedTeamId,
          password: captainPasscode,
        }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("badminton_auction_role", "captain");
        localStorage.setItem("badminton_auction_user", JSON.stringify(data.user));
        success(`Welcome, ${data.user.name}! Logged in as ${data.user.teamName} Captain.`);
        router.push("/admin/live");
      } else {
        setErrorMessage(data.message || "Invalid team passcode.");
        error(data.message || "Invalid team passcode.");
      }
    } catch {
      setErrorMessage("Network error during captain login.");
      error("Network error.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("badminton_auction_role", "admin");
        localStorage.setItem("badminton_auction_user", JSON.stringify(data.user));
        success("Logged in successfully as Tournament Admin!");
        router.push("/admin/live");
      } else {
        setErrorMessage(data.message || "Invalid credentials.");
        error(data.message || "Invalid credentials.");
      }
    } catch {
      setErrorMessage("Network error during authentication.");
      error("Network error.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsViewer = () => {
    localStorage.setItem("badminton_auction_role", "viewer");
    localStorage.removeItem("badminton_auction_user");
    success("Viewing Live Auction as Spectator (Read-Only Mode).");
    router.push("/admin/live");
  };

  return (
    <div className="min-h-screen bg-[#070e17] court-bg text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Glow shapes */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top bar */}
      <div className="p-6 flex items-center justify-between relative z-10 max-w-6xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-lg shadow-md shadow-emerald-500/30">
            🏸
          </div>
          <span className="font-bold text-white text-sm">Hostel Day Sports</span>
        </Link>
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-white transition"
        >
          Back to Home
        </Link>
      </div>

      {/* Main Card */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-slate-900/90 border border-slate-700/70 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl stadium-glow">
          
          {/* Badminton Badge Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-3xl shadow-xl shadow-emerald-500/20 mb-3 animate-bounce-slight">
              🏸
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Hostel Day Badminton Auction 2026
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Select your role to access the live bidding arena
            </p>
          </div>

          {/* Role Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab("captain");
                setErrorMessage("");
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition ${
                activeTab === "captain"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Team Captain</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("admin");
                setErrorMessage("");
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition ${
                activeTab === "admin"
                  ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Auctioneer</span>
            </button>
          </div>

          {/* Error notice */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/50 flex items-center gap-2.5 text-xs text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: TEAM CAPTAIN LOGIN */}
          {activeTab === "captain" && (
            <form onSubmit={handleCaptainLogin} className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Select Franchise Team
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                  {teams.map((t) => {
                    const isSelected = t.id === selectedTeamId;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleTeamChange(t.id)}
                        className={`p-2.5 rounded-2xl border text-left flex flex-col items-center justify-center gap-1 transition ${
                          isSelected
                            ? "bg-emerald-500/20 border-emerald-400 shadow-md shadow-emerald-500/10 scale-102"
                            : "bg-slate-800/60 border-slate-700/80 hover:border-slate-600 text-slate-300"
                        }`}
                      >
                        <span className="text-2xl">{t.logo || "🏸"}</span>
                        <span className="text-xs font-black text-center truncate w-full" style={{ color: isSelected ? "#34d399" : "#ffffff" }}>
                          {t.name}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate w-full text-center">
                          {t.captain.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Team Info Box */}
              {selectedTeam && (
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl">{selectedTeam.logo || "🏸"}</span>
                    <div>
                      <span className="text-sm font-black text-white block">{selectedTeam.name}</span>
                      <span className="text-xs text-emerald-400 font-semibold">Captain: {selectedTeam.captain}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-amber-400">
                    1,000 coins
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Captain Team Passcode
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={captainPasscode}
                    onChange={(e) => setCaptainPasscode(e.target.value)}
                    placeholder="e.g. smash2026 or captain2026"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-emerald-400 transition font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition active:scale-98 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                <Trophy className="w-4 h-4 text-slate-950" />
                <span>{loading ? "Verifying..." : `Enter as ${selectedTeam?.name} Captain`}</span>
              </button>
            </form>
          )}

          {/* TAB 2: ADMIN AUCTIONEER LOGIN */}
          {activeTab === "admin" && (
            <form onSubmit={handleAdminLogin} className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Admin Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-emerald-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-emerald-400 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/25 transition active:scale-98 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                <span>{loading ? "Authenticating..." : "Admin Auctioneer Login"}</span>
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-xs uppercase font-bold text-slate-400">
              Or Spectate
            </span>
            <div className="border-t border-slate-800 w-full" />
          </div>

          {/* Continue as Viewer */}
          <button
            onClick={handleContinueAsViewer}
            className="w-full py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm transition flex items-center justify-center gap-2 hover:border-slate-600"
          >
            <Eye className="w-4 h-4 text-sky-400" />
            <span>Continue as Spectator (Big Screen / Viewer)</span>
          </button>

          {/* Quick Credentials Guide Box */}
          <div className="mt-6 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Team Captain Quick Passcodes:</span>
            </div>
            <div className="text-[10px] grid grid-cols-2 gap-x-2 gap-y-1 text-slate-300 font-mono">
              <div>• Shuttle Trouble: <span className="text-emerald-400">hemanth2026</span></div>
              <div>• Court Crushers: <span className="text-emerald-400">prasad2026</span></div>
              <div>• Team Phonix: <span className="text-emerald-400">chitti2026</span></div>
              <div>• AERO VEX: <span className="text-emerald-400">venky2026</span></div>
              <div>• ShuttleStorm: <span className="text-emerald-400">govind2026</span></div>
              <div>• Hit & Run: <span className="text-emerald-400">surya2026</span></div>
              <div>• Juggernauts: <span className="text-emerald-400">ranjith2026</span></div>
              <div>• ACE Attackers: <span className="text-emerald-400">manikumar2026</span></div>
            </div>
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
              Universal Captain Passcode: <span className="text-emerald-400 font-mono font-bold">captain2026</span> | Admin: <span className="text-amber-400 font-mono font-bold">admin / hostel2026</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 text-center text-xs text-slate-400">
        Hostel Day Badminton Auction 2026
      </div>
    </div>
  );
}
