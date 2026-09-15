"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Undo2,
  ChevronRight,
  Maximize,
  Minimize,
  Radio,
  Clock,
  Volume2,
  VolumeX,
  ShieldCheck,
  Eye,
  AlertTriangle,
  History,
  Trophy,
  ArrowRight,
  Sparkles,
  Lock,
} from "lucide-react";
import { DatabaseSchema, Player, Team, Bid, AuctionState, UserSession, UserRole } from "@/types";
import { soundManager } from "@/lib/audio";
import { useToast } from "@/components/Toast";
import SoldCelebrationModal from "@/components/SoldCelebrationModal";
import PlayerCardModal from "@/components/PlayerCardModal";
import { formatCurrency } from "@/lib/utils";

export default function LiveAuctionPage() {
  const { toast, success, error, info } = useToast();

  const [db, setDb] = useState<DatabaseSchema | null>(null);
  const [role, setRole] = useState<UserRole>("admin");
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedPlayerForModal, setSelectedPlayerForModal] = useState<Player | null>(null);

  // Sold modal celebration state
  const [soldModalOpen, setSoldModalOpen] = useState(false);
  const [soldPlayer, setSoldPlayer] = useState<Player | null>(null);
  const [soldTeam, setSoldTeam] = useState<Team | null>(null);
  const [soldPrice, setSoldPrice] = useState<number>(0);

  // Sound state
  const [soundOn, setSoundOn] = useState(true);

  // Local timer ref for smooth countdown animation
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousBidCountRef = useRef<number>(0);
  const previousTimerSecRef = useRef<number>(30);

  // 1. Role initialization
  useEffect(() => {
    const savedRole = localStorage.getItem("badminton_auction_role") as UserRole | null;
    if (savedRole) {
      setRole(savedRole);
    }
    const savedUserStr = localStorage.getItem("badminton_auction_user");
    if (savedUserStr) {
      try {
        setCurrentUser(JSON.parse(savedUserStr));
      } catch {}
    }
    setSoundOn(soundManager.isEnabled());
  }, []);

  // 2. Fetch initial state & connect to Server-Sent Events (SSE)
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const res = await fetch("/api/auction/state");
        const json = await res.json();
        if (json.success && json.data) {
          setDb(json.data);
        }
      } catch (e) {
        console.error("Fetch state error", e);
      }
    };
    fetchInitial();

    // Setup SSE connection for instant multi-device live sync
    const eventSource = new EventSource("/api/auction/stream");

    eventSource.onmessage = (event) => {
      try {
        const updatedDb: DatabaseSchema = JSON.parse(event.data);
        setDb(updatedDb);
      } catch (e) {
        // Ping or non-json message
      }
    };

    eventSource.onerror = () => {
      // If SSE disconnects, fall back to occasional polling
      console.warn("SSE connection interrupted, using poll fallback");
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // 3. Audio Triggers on State Changes
  useEffect(() => {
    if (!db) return;
    const bids = db.auctionState.bidHistory;

    // Check if new bid arrived
    if (bids.length > previousBidCountRef.current) {
      soundManager.playBidSound();
    }
    previousBidCountRef.current = bids.length;

    // Timer warning beep on last 5 seconds
    const sec = db.auctionState.timerSeconds;
    if (db.auctionState.status === "LIVE" && sec > 0 && sec <= 5 && sec !== previousTimerSecRef.current) {
      soundManager.playWarningTick();
    }
    previousTimerSecRef.current = sec;
  }, [db]);

  // 4. Admin Timer Countdown Runner
  useEffect(() => {
    if (role !== "admin" || !db || db.auctionState.status !== "LIVE") {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(async () => {
      setDb((prev) => {
        if (!prev || prev.auctionState.status !== "LIVE") return prev;
        const currentSec = prev.auctionState.timerSeconds;
        if (currentSec <= 1) {
          // Time's up
          sendAction("TICK", { seconds: 0 });
          return {
            ...prev,
            auctionState: {
              ...prev.auctionState,
              timerSeconds: 0,
              status: "ENDED",
            },
          };
        } else {
          // Decrement locally and push tick
          if (currentSec % 5 === 0 || currentSec <= 5) {
            sendAction("TICK", { seconds: currentSec - 1 });
          }
          return {
            ...prev,
            auctionState: {
              ...prev.auctionState,
              timerSeconds: currentSec - 1,
            },
          };
        }
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [role, db?.auctionState.status]);

  // Action dispatcher
  const sendAction = async (action: string, payload: Record<string, unknown> = {}) => {
    try {
      const res = await fetch("/api/auction/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          role,
          captainTeamId: currentUser?.teamId,
          ...payload,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        error(data.message || "Action failed");
      } else if (data.database) {
        setDb(data.database);
      }
      return data;
    } catch {
      error("Network error executing auction action.");
      return { success: false };
    }
  };

  // Handler functions
  const handleStartAuction = (playerId: string) => {
    sendAction("START", { playerId });
    success("Auction started for player!");
  };

  const handlePlaceBid = (teamId: string, customAmount?: number) => {
    if (!db || db.auctionState.status !== "LIVE") {
      error("Auction is not currently active. Click Start Auction first.");
      return;
    }

    if (role === "captain" && currentUser?.teamId && teamId !== currentUser.teamId) {
      error(`You are the captain of ${currentUser.teamName || "your team"}. You can only bid for your own franchise!`);
      return;
    }

    const team = db.teams.find((t) => t.id === teamId);
    if (!team) return;

    const nextBid =
      customAmount ||
      (!db.auctionState.highestBidTeamId
        ? db.auctionState.currentBid
        : db.auctionState.currentBid + (db.auctionState.selectedIncrement || 20));

    if (team.remainingBudget < nextBid) {
      error(`Insufficient budget! ${team.name} only has ${formatCurrency(team.remainingBudget, currency)}, need ${formatCurrency(nextBid, currency)}.`);
      return;
    }

    sendAction("BID", { teamId, amount: nextBid });
  };

  const handleUndoBid = () => {
    sendAction("UNDO");
    info("Undone latest bid.");
  };

  const handlePauseResume = () => {
    if (db?.auctionState.status === "LIVE") {
      sendAction("PAUSE");
      info("Auction paused.");
    } else if (db?.auctionState.status === "PAUSED") {
      sendAction("RESUME");
      info("Auction resumed.");
    }
  };

  const handleSold = async () => {
    if (!db?.auctionState.highestBidTeamId) {
      error("Cannot mark SOLD without any bids. Click UNSOLD instead.");
      return;
    }

    const res = await sendAction("SOLD");
    if (res.success && res.player && res.team) {
      setSoldPlayer(res.player);
      setSoldTeam(res.team);
      setSoldPrice(res.finalPrice);
      setSoldModalOpen(true);
    }
  };

  const handleUnsold = async () => {
    if (confirm("Are you sure you want to mark this player as UNSOLD?")) {
      const res = await sendAction("UNSOLD");
      if (res.success) {
        soundManager.playUnsoldGavel();
        const p = res.player;
        if (p?.unsoldRound === 1) {
          info(`${p.name} marked UNSOLD. They will return in Round 2! 🔄`);
        } else {
          info(`${p?.name || "Player"} marked UNSOLD (Final Round).`);
        }
      }
    }
  };

  const handleNextPlayer = () => {
    setSoldModalOpen(false);
    sendAction("NEXT");
  };

  const handleResetAuction = () => {
    if (confirm("Reset current player's auction back to idle? Current bids will be cleared.")) {
      sendAction("RESET");
      info("Current auction reset to idle.");
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  if (!db) {
    return (
      <div className="min-h-screen bg-[#070e17] flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl animate-spin">
            🏸
          </div>
          <span className="font-bold text-sm">Connecting to Live Auction Stream...</span>
        </div>
      </div>
    );
  }

  const { auctionState, players, teams, settings } = db;
  const currency = settings.currency || "coins";
  const currentPlayer = players.find((p) => p.id === auctionState.currentPlayerId);
  const highestTeam = teams.find((t) => t.id === auctionState.highestBidTeamId);

  // Calculate next bid increment
  const nextIncrement = auctionState.selectedIncrement || 20;
  const nextBidAmount = !auctionState.highestBidTeamId
    ? auctionState.currentBid
    : auctionState.currentBid + nextIncrement;

  // Captain helper calculations
  const captainTeam =
    role === "captain" && currentUser?.teamId
      ? teams.find((t) => t.id === currentUser.teamId)
      : null;
  const isMyTeamLeading = captainTeam ? auctionState.highestBidTeamId === captainTeam.id : false;
  const canMyTeamAfford = captainTeam ? captainTeam.remainingBudget >= nextBidAmount : false;

  // Next up in queue: sequentially advance from current player's queueOrder
  const currentOrder = currentPlayer?.queueOrder || 0;
  const isRound2Active = auctionState.currentRound === 2 || currentPlayer?.round === 2;

  // Round 1 available queue
  const r1AfterCurrent = players
    .filter((p) => p.status === "Available" && (!p.round || p.round === 1) && p.queueOrder > currentOrder)
    .sort((a, b) => a.queueOrder - b.queueOrder);
  const r1BeforeCurrent = players
    .filter((p) => p.status === "Available" && (!p.round || p.round === 1) && p.queueOrder <= currentOrder && p.id !== currentPlayer?.id)
    .sort((a, b) => a.queueOrder - b.queueOrder);
  const nextR1 = r1AfterCurrent[0] || r1BeforeCurrent[0];

  // Round 2 eligible unsold players (unsold in round 1, waiting for second chance)
  const round2Eligible = players
    .filter((p) => p.status === "Unsold" && p.unsoldRound === 1 && p.id !== currentPlayer?.id)
    .sort((a, b) => a.queueOrder - b.queueOrder);

  // Determine next up
  let nextPlayer: Player | undefined;
  let isNextRound2 = false;

  if (!isRound2Active && nextR1) {
    nextPlayer = nextR1;
    isNextRound2 = false;
  } else if (round2Eligible.length > 0) {
    const r2AfterCurrent = round2Eligible.filter((p) => p.queueOrder > currentOrder);
    nextPlayer = r2AfterCurrent[0] || round2Eligible[0];
    isNextRound2 = true;
  }

  const allAvailablePlayers = players
    .filter((p) => p.status === "Available" && (!p.round || p.round === 1) && p.id !== currentPlayer?.id)
    .sort((a, b) => a.queueOrder - b.queueOrder);

  // Timer calculation
  const timerSec = auctionState.timerSeconds;
  const initialSec = auctionState.initialTimerSeconds || 30;
  const timerPercent = Math.max(0, Math.min(100, (timerSec / initialSec) * 100));

  return (
    <div
      className={`min-h-screen bg-[#070e17] text-slate-100 court-bg flex flex-col justify-between overflow-x-hidden ${
        isFullscreen ? "projector-mode p-4" : "p-3 sm:p-5 lg:p-6"
      }`}
    >
      {/* Top Tournament Bar */}
      <header className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
              🏸
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm sm:text-base tracking-tight text-white group-hover:text-emerald-400 transition">
                  {settings.tournamentName}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-extrabold uppercase">
                  Live Arena
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block">
                {settings.subtitle}
              </p>
            </div>
          </Link>
        </div>

        {/* Action badges, sound toggle, projector mode */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick status pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-xs font-bold">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  auctionState.status === "LIVE"
                    ? "bg-red-400"
                    : auctionState.status === "PAUSED"
                    ? "bg-amber-400"
                    : "bg-slate-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  auctionState.status === "LIVE"
                    ? "bg-red-500"
                    : auctionState.status === "PAUSED"
                    ? "bg-amber-500"
                    : "bg-slate-500"
                }`}
              />
            </span>
            <span className="uppercase tracking-wider text-[11px]">
              {auctionState.status === "LIVE"
                ? "Bidding Active"
                : auctionState.status === "PAUSED"
                ? "Auction Paused"
                : auctionState.status === "ENDED"
                ? "Time's Up"
                : "Idle"}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              const newState = soundManager.toggleSound();
              setSoundOn(newState);
            }}
            className={`p-2 rounded-xl border text-xs font-bold transition ${
              soundOn
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                : "bg-slate-800 border-slate-700 text-slate-400"
            }`}
            title={soundOn ? "Mute sound" : "Enable sound"}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Projector Fullscreen Mode */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-slate-500 text-xs font-bold text-slate-200 hover:text-white transition shadow-sm"
            title="Toggle Big-Screen Projector Mode"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {isFullscreen ? "Exit Projector" : "Projector Mode"}
            </span>
          </button>

          {/* Role badge */}
          {role === "captain" && currentUser ? (
            <div className="flex items-center gap-2">
              <div
                className="px-3 py-1.5 rounded-xl border text-xs font-black tracking-wider flex items-center gap-1.5 shadow-sm"
                style={{
                  backgroundColor: `${currentUser.teamColor || "#10b981"}25`,
                  borderColor: `${currentUser.teamColor || "#10b981"}60`,
                  color: currentUser.teamColor || "#34d399",
                }}
              >
                <span className="text-sm">{currentUser.teamLogo || "🏸"}</span>
                <span className="truncate max-w-[120px] sm:max-w-[180px]">
                  {currentUser.teamName} (Capt. {currentUser.name?.split(" ")[0]})
                </span>
              </div>
              <Link
                href="/login"
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-300 transition"
              >
                Switch
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div
                className={`px-3 py-1.5 rounded-xl border text-xs font-black tracking-wider uppercase flex items-center gap-1.5 ${
                  role === "admin"
                    ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                    : "bg-sky-500/10 border-sky-500/40 text-sky-400"
                }`}
              >
                {role === "admin" ? <ShieldCheck className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{role === "admin" ? "Admin" : "Spectator"}</span>
              </div>
              {role === "admin" ? (
                <Link
                  href="/admin/dashboard"
                  className="hidden sm:inline-flex px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
                >
                  Console
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-300 transition"
                >
                  Login
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Sports Broadcast Arena Layout (Left - Center - Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 flex-1 items-stretch">
        
        {/* ================= LEFT SIDE: Current Player Profile & Specs ================= */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="card-glass rounded-3xl p-5 border border-slate-800 flex-1 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">
                  Player Specifications
                </span>
                {currentPlayer && (
                  <button
                    onClick={() => setSelectedPlayerForModal(currentPlayer)}
                    className="text-xs text-sky-400 hover:text-sky-300 font-semibold underline"
                  >
                    Full Details
                  </button>
                )}
              </div>

              {currentPlayer ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                      College Identity
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-base font-bold text-white">{currentPlayer.name}</span>
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {currentPlayer.rollNumber}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Branch</span>
                      <span className="text-sm font-bold text-slate-200">{currentPlayer.branch}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Year</span>
                      <span className="text-sm font-bold text-slate-200">{currentPlayer.year} Year</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Playing Type</span>
                      <span className="text-sm font-extrabold text-sky-400">{currentPlayer.playingType}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Skill Level</span>
                      <span className="text-sm font-extrabold text-emerald-400">{currentPlayer.skillLevel}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                    <span className="text-[11px] text-amber-300 uppercase font-semibold block">Base Price</span>
                    <span className="text-2xl font-black text-amber-400">
                      {formatCurrency(currentPlayer.basePrice, currency)}
                    </span>
                  </div>

                  {currentPlayer.notes && (
                    <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs text-slate-300 italic">
                      &ldquo;{currentPlayer.notes}&rdquo;
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center my-auto">
                  <div className="text-4xl mb-3">🏸</div>
                  <p className="font-bold text-sm text-slate-300">No Player Under the Hammer</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Select a player from the queue below to start the bidding war.
                  </p>
                </div>
              )}
            </div>

            {/* Next Up preview box */}
            {nextPlayer ? (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-400 font-bold uppercase flex items-center gap-1.5">
                    {isNextRound2 ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-amber-400">Up Next: Round 2 ({round2Eligible.length} unsold in line)</span>
                      </>
                    ) : (
                      <span>Up Next in Queue ({allAvailablePlayers.length} in line)</span>
                    )}
                  </span>
                  <span className={`font-mono font-bold ${isNextRound2 ? "text-amber-400" : "text-emerald-400"}`}>
                    #{nextPlayer.queueOrder} {isNextRound2 ? "(R2)" : ""}
                  </span>
                </div>
                <div className={`flex items-center justify-between p-2.5 rounded-xl border ${
                  isNextRound2
                    ? "bg-amber-500/10 border-amber-500/30"
                    : "bg-slate-900/60 border-slate-800/80"
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                      {nextPlayer.photo ? (
                        <img
                          src={nextPlayer.photo}
                          alt={nextPlayer.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = "flex";
                          }}
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                      <span
                        style={{ display: nextPlayer.photo ? "none" : "flex" }}
                        className="text-xs items-center justify-center h-full w-full bg-slate-800"
                      >
                        🏸
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white block">{nextPlayer.name}</span>
                        {isNextRound2 && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ROUND 2
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">{nextPlayer.branch} • {nextPlayer.playingType}</span>
                    </div>
                  </div>

                  {role === "admin" && (
                    <button
                      onClick={() => handleStartAuction(nextPlayer.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm active:scale-95 ${
                        isNextRound2
                          ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40"
                          : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                      }`}
                      title={`Call #${nextPlayer.queueOrder} ${nextPlayer.name} to the hammer ${isNextRound2 ? "(Round 2)" : ""}`}
                    >
                      <span>Call Next {isNextRound2 ? "(R2)" : ""}</span>
                    </button>
                  )}
                </div>

                {/* Quick jump to any player in queue selector */}
                {role === "admin" && (allAvailablePlayers.length > 0 || round2Eligible.length > 0) && (
                  <div className="mt-2.5">
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) handleStartAuction(e.target.value);
                      }}
                      className="w-full p-2 bg-slate-900 border border-slate-700/80 rounded-xl text-[11px] text-slate-300 focus:outline-hidden focus:border-emerald-400 cursor-pointer"
                    >
                      <option value="">Jump to specific player in queue...</option>
                      {allAvailablePlayers.length > 0 && (
                        <optgroup label={`Round 1 Lineup (${allAvailablePlayers.length})`}>
                          {allAvailablePlayers.map((p) => (
                            <option key={p.id} value={p.id}>
                              #{p.queueOrder} - {p.name} ({p.branch} • {p.playingType})
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {round2Eligible.length > 0 && (
                        <optgroup label={`Round 2 Unsold Players (${round2Eligible.length})`}>
                          {round2Eligible.map((p) => (
                            <option key={p.id} value={p.id}>
                              #{p.queueOrder} - {p.name} (Round 2 • {p.branch})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-slate-800 text-center text-xs text-slate-500 py-2">
                <span>All queued players across all rounds have been called</span>
              </div>
            )}
          </div>
        </div>

        {/* ================= CENTER: Large Player Photo, Live Status, Timer ================= */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center gap-4">
          <div className="w-full card-glass rounded-3xl p-6 md:p-8 border border-slate-800 text-center flex flex-col items-center justify-center relative overflow-hidden stadium-glow">
            
            {/* Top status indicator badge */}
            <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
              {auctionState.status === "LIVE" ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-extrabold text-xs uppercase tracking-widest animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span>ON THE HAMMER • LIVE</span>
                </div>
              ) : auctionState.status === "PAUSED" ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-extrabold text-xs uppercase tracking-widest">
                  <Pause className="w-3.5 h-3.5" />
                  <span>AUCTION PAUSED</span>
                </div>
              ) : auctionState.status === "ENDED" ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 font-extrabold text-xs uppercase tracking-widest">
                  <Clock className="w-3.5 h-3.5" />
                  <span>AUCTION ENDED • AWAITING DECISION</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-bold text-xs uppercase tracking-widest">
                  <span>AUCTION STANDBY</span>
                </div>
              )}

              {/* Round 2 Second Chance Badge */}
              {(currentPlayer?.round === 2 || auctionState.currentRound === 2) && (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-xs uppercase tracking-wider shadow-sm animate-pulse">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>ROUND 2 • SECOND CHANCE</span>
                </div>
              )}
            </div>

            {/* Big Player Photo with Live Halo */}
            <div className="relative mb-5">
              <div
                className={`w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-3xl overflow-hidden border-4 bg-slate-900 shadow-2xl transition-all duration-300 ${
                  auctionState.status === "LIVE"
                    ? "border-emerald-400 shadow-emerald-500/30 scale-102 ring-8 ring-emerald-500/10"
                    : "border-slate-700"
                }`}
              >
                {currentPlayer?.photo ? (
                  <img
                    src={currentPlayer.photo}
                    alt={currentPlayer.name}
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
                  style={{ display: currentPlayer?.photo ? "none" : "flex" }}
                  className="w-full h-full flex flex-col items-center justify-center text-slate-600"
                >
                  <span className="text-7xl">🏸</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-2">
                    {currentPlayer?.name || "Badminton Star"}
                  </span>
                </div>
              </div>

              {/* Status flag on photo */}
              {currentPlayer && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-slate-900/95 border border-slate-700 text-white font-bold text-xs shadow-lg uppercase tracking-wider whitespace-nowrap">
                  {currentPlayer.gender} • {currentPlayer.branch}
                </div>
              )}
            </div>

            {/* Player Name */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
              {currentPlayer ? currentPlayer.name : "Waiting for Player"}
            </h2>

            {/* Roll & department */}
            {currentPlayer && (
              <p className="text-sm sm:text-base font-mono text-emerald-400 font-bold mb-4">
                Roll No: {currentPlayer.rollNumber}
              </p>
            )}

            {/* Countdown Timer Ring / Bar */}
            <div className="w-full max-w-sm mt-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Bid Clock</span>
                </span>
                <span
                  className={`text-xl font-black tracking-tight ${
                    timerSec <= 5 && auctionState.status === "LIVE"
                      ? "text-rose-400 animate-pulse text-2xl"
                      : "text-white"
                  }`}
                >
                  {timerSec >= 60
                    ? `${Math.floor(timerSec / 60)}:${(timerSec % 60).toString().padStart(2, "0")} (${timerSec}s)`
                    : `${timerSec}s`}
                </span>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full h-3.5 rounded-full bg-slate-800/80 p-0.5 border border-slate-700/60 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    timerSec <= 5
                      ? "bg-rose-500 shadow-lg shadow-rose-500/50"
                      : timerSec <= 10
                      ? "bg-amber-400"
                      : "bg-gradient-to-r from-teal-400 to-emerald-400"
                  }`}
                  style={{ width: `${timerPercent}%` }}
                />
              </div>
            </div>

            {/* Admin Live Controls Banner */}
            {role === "admin" && currentPlayer && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 w-full pt-4 border-t border-slate-800">
                {auctionState.status === "IDLE" || auctionState.status === "ENDED" ? (
                  <button
                    onClick={() => handleStartAuction(currentPlayer.id)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Auction</span>
                  </button>
                ) : (
                  <button
                    onClick={handlePauseResume}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition"
                  >
                    {auctionState.status === "LIVE" ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Resume</span>
                      </>
                    )}
                  </button>
                )}

                {/* SOLD Button */}
                <button
                  onClick={handleSold}
                  disabled={!auctionState.highestBidTeamId}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/30 transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>SOLD!</span>
                </button>

                {/* UNSOLD Button */}
                <button
                  onClick={handleUnsold}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95"
                >
                  <XCircle className="w-4 h-4" />
                  <span>UNSOLD</span>
                </button>

                {/* UNDO Button */}
                <button
                  onClick={handleUndoBid}
                  disabled={auctionState.bidHistory.length === 0}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-40"
                  title="Undo last bid"
                >
                  <Undo2 className="w-4 h-4" />
                  <span>Undo</span>
                </button>

                {/* RESET CURRENT AUCTION */}
                <button
                  onClick={handleResetAuction}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs transition"
                  title="Reset Current Auction"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Captain Live Bidding Cockpit */}
            {role === "captain" && captainTeam && currentPlayer && (
              <div className="mt-6 w-full p-4 rounded-2xl bg-gradient-to-r from-slate-900/95 via-slate-950 to-slate-900/95 border border-emerald-500/40 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl">{captainTeam.logo || "🏸"}</span>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-white">{captainTeam.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                          Captain Console
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">Capt. {captainTeam.captain}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Your Purse</span>
                      <span className="text-sm font-mono font-black text-amber-400">
                        {formatCurrency(captainTeam.remainingBudget, currency)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Squad</span>
                      <span className="text-sm font-mono font-black text-slate-200">
                        {captainTeam.players.length} Players
                      </span>
                    </div>
                  </div>
                </div>

                {/* Real-time Status Alert for Captain */}
                <div className="mb-3">
                  {isMyTeamLeading ? (
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-xs text-center flex items-center justify-center gap-2 animate-pulse">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>YOUR TEAM IS THE HIGHEST BIDDER AT {formatCurrency(auctionState.currentBid, currency)}! 🎉</span>
                    </div>
                  ) : auctionState.status === "LIVE" ? (
                    <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs text-center flex items-center justify-center gap-2">
                      <span>⚠️ {highestTeam ? `${highestTeam.name} is leading with ${formatCurrency(auctionState.currentBid, currency)}.` : "Opening bid required."} Place a bid to take the lead!</span>
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-slate-800/80 text-slate-400 text-xs text-center">
                      Auction is currently {auctionState.status.toLowerCase()}. Awaiting auctioneer to call bids.
                    </div>
                  )}
                </div>

                {/* Captain Bid Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  {/* Step increment selector */}
                  <div className="flex items-center gap-1 w-full sm:w-auto">
                    {(settings.bidIncrements || [10, 20, 50, 100]).map((inc) => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => sendAction("SET_INCREMENT", { increment: inc })}
                        className={`flex-1 sm:flex-initial py-2 px-2.5 rounded-xl text-xs font-black transition ${
                          auctionState.selectedIncrement === inc
                            ? "bg-emerald-500 text-slate-950 shadow-md"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        +{inc}
                      </button>
                    ))}
                  </div>

                  {/* Big Captain Bid Action Button */}
                  <button
                    type="button"
                    onClick={() => handlePlaceBid(captainTeam.id)}
                    disabled={
                      isMyTeamLeading ||
                      !canMyTeamAfford ||
                      auctionState.status !== "LIVE"
                    }
                    className={`flex-1 w-full py-3 px-5 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition active:scale-98 ${
                      isMyTeamLeading
                        ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default"
                        : canMyTeamAfford && auctionState.status === "LIVE"
                        ? "bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-300 hover:brightness-110 text-slate-950 shadow-emerald-500/30 animate-pulse"
                        : "bg-slate-800 text-slate-500 border border-slate-800 cursor-not-allowed"
                    }`}
                  >
                    <Trophy className="w-4 h-4 fill-current" />
                    <span>
                      {isMyTeamLeading
                        ? "Your Team Is Leading!"
                        : !canMyTeamAfford
                        ? "Low Team Purse"
                        : auctionState.status !== "LIVE"
                        ? "Waiting For Bidding..."
                        : `+ BID ${formatCurrency(nextBidAmount, currency)} FOR ${captainTeam.name}`}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT SIDE: Live Bid Information & Bid History ================= */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Big Live Bid Board */}
          <div className="card-glass rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 block mb-1">
                Current Highest Bid
              </span>

              {/* Big Price Display */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-slate-900 border border-amber-500/30 mb-4 text-center">
                <span className="text-4xl sm:text-5xl md:text-6xl font-black text-amber-400 tracking-tight drop-shadow-md">
                  {formatCurrency(auctionState.currentBid, currency)}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  {!auctionState.highestBidTeamId
                    ? "Base Opening Price • Awaiting First Bid"
                    : "Current Leading Offer"}
                </span>
              </div>

              {/* Highest Bidding Team Banner */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 mb-4">
                <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">
                  Leading Franchise
                </span>

                {highestTeam ? (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{highestTeam.logo || "🏸"}</span>
                    <div>
                      <span
                        className="text-lg md:text-xl font-black tracking-wide block"
                        style={{ color: highestTeam.color || "#f59e0b" }}
                      >
                        {highestTeam.name}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        Purse Remaining: {formatCurrency(highestTeam.remainingBudget, currency)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-sm text-slate-400 font-semibold italic">
                    No team has placed a bid yet
                  </div>
                )}
              </div>

              {/* Bid Increment Selector (for Admin) */}
              {role === "admin" && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-bold text-slate-400">
                    <span className="uppercase">Bid Step Increment</span>
                    <span className="text-emerald-400">Next Bid: {formatCurrency(nextBidAmount, currency)}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(settings.bidIncrements || [10, 20, 50, 100]).map((inc) => (
                      <button
                        key={inc}
                        onClick={() => sendAction("SET_INCREMENT", { increment: inc })}
                        className={`py-1.5 px-2 rounded-xl text-xs font-black transition ${
                          auctionState.selectedIncrement === inc
                            ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                            : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        +{inc} {currency}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Real-time Bid Log Stream */}
            <div className="pt-3 border-t border-slate-800">
              <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  <span>Live Bid Stream ({auctionState.bidHistory.length})</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Latest on top</span>
              </span>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {auctionState.bidHistory.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800/60">
                    Waiting for first bid...
                  </div>
                ) : (
                  auctionState.bidHistory.map((bid, idx) => (
                    <div
                      key={bid.id}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs transition animate-in fade-in slide-in-from-top-2 ${
                        idx === 0
                          ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-100 font-bold"
                          : "bg-slate-900/60 border border-slate-800/70 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: bid.teamColor || "#10b981" }}
                        />
                        <span className="truncate">{bid.teamName}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-mono font-black text-amber-400">
                          {formatCurrency(bid.amount, currency)}
                        </span>
                        <span className="text-[10px] text-slate-400">{bid.timestamp}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM: Live Team Bidding Cards & Budget Tracking ================= */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs uppercase font-black tracking-wider text-slate-300">
              Franchise Bidding Controls & Budget Purses ({teams.length} Teams)
            </span>
          </div>
          {role === "viewer" && (
            <span className="text-xs text-sky-400 font-semibold">
              Spectator Mode • Real-Time Broadcast
            </span>
          )}
        </div>

        {/* Responsive Grid of Teams */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {teams.map((team) => {
            const isHighest = team.id === auctionState.highestBidTeamId;
            const canAfford = team.remainingBudget >= nextBidAmount;
            const budgetPercent = Math.max(0, Math.min(100, (team.spent / team.initialBudget) * 100));

            return (
              <div
                key={team.id}
                className={`card-glass rounded-2xl p-3.5 border transition-all duration-200 flex flex-col justify-between ${
                  isHighest
                    ? "border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30 scale-102"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                <div>
                  {/* Team Logo & Name */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-xl">{team.logo || "🏸"}</span>
                      <span
                        className="text-xs font-black truncate"
                        style={{ color: team.color || "#ffffff" }}
                      >
                        {team.name}
                      </span>
                    </div>

                    {isHighest && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black uppercase tracking-wider">
                        LEAD
                      </span>
                    )}
                  </div>

                  {/* Budget details */}
                  <div className="space-y-1 mb-2.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Remaining:</span>
                      <span
                        className={`font-mono font-bold ${
                          team.remainingBudget < 100 ? "text-rose-400" : "text-emerald-400"
                        }`}
                      >
                        {formatCurrency(team.remainingBudget, currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span>Squad Size:</span>
                      <span className="font-bold text-slate-300">{team.players.length} Players</span>
                    </div>

                    {/* Budget Usage Bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mt-1">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full"
                        style={{ width: `${budgetPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bidding Button */}
                {role === "admin" ? (
                  <button
                    onClick={() => handlePlaceBid(team.id)}
                    disabled={
                      !canAfford ||
                      auctionState.status !== "LIVE" ||
                      isHighest
                    }
                    className={`w-full py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1.5 ${
                      isHighest
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-default"
                        : canAfford && auctionState.status === "LIVE"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20"
                        : "bg-slate-800/80 text-slate-400 border border-slate-800 cursor-not-allowed"
                    }`}
                  >
                    {isHighest ? (
                      <span>Current Leader</span>
                    ) : !canAfford ? (
                      <span>Low Budget</span>
                    ) : (
                      <span>+ BID {formatCurrency(nextBidAmount, currency)}</span>
                    )}
                  </button>
                ) : role === "captain" && currentUser?.teamId === team.id ? (
                  <button
                    onClick={() => handlePlaceBid(team.id)}
                    disabled={
                      !canAfford ||
                      auctionState.status !== "LIVE" ||
                      isHighest
                    }
                    className={`w-full py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1.5 ${
                      isHighest
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default"
                        : canAfford && auctionState.status === "LIVE"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/25 animate-pulse"
                        : "bg-slate-800/80 text-slate-400 border border-slate-800 cursor-not-allowed"
                    }`}
                  >
                    {isHighest ? (
                      <span>Your Team Leads!</span>
                    ) : !canAfford ? (
                      <span>Low Budget</span>
                    ) : (
                      <span>+ YOUR BID ({formatCurrency(nextBidAmount, currency)})</span>
                    )}
                  </button>
                ) : role === "captain" ? (
                  <div className="w-full py-1.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-900/60 rounded-xl border border-slate-800/60 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3 text-slate-600" />
                    <span>Locked ({team.name})</span>
                  </div>
                ) : (
                  <div className="w-full py-1.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/60 rounded-xl border border-slate-800">
                    {isHighest ? "Highest Bidder" : "Team Franchise"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SOLD Celebration Modal */}
      <SoldCelebrationModal
        isOpen={soldModalOpen}
        player={soldPlayer}
        team={soldTeam}
        finalPrice={soldPrice}
        currency={currency}
        onClose={() => setSoldModalOpen(false)}
        onNextPlayer={handleNextPlayer}
      />

      {/* Player Details Modal */}
      <PlayerCardModal
        player={selectedPlayerForModal}
        teams={teams}
        bids={db.bids}
        currency={currency}
        isAdmin={role === "admin"}
        onClose={() => setSelectedPlayerForModal(null)}
        onStartAuction={(p) => handleStartAuction(p.id)}
      />
    </div>
  );
}
