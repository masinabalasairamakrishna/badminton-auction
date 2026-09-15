"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Maximize, Minimize, ShieldCheck, Eye, LogOut, Menu, X, Flame } from "lucide-react";
import AudioControls from "./AudioControls";

interface NavbarProps {
  onMenuToggle?: () => void;
  isSidebarOpen?: boolean;
}

export default function Navbar({ onMenuToggle, isSidebarOpen }: NavbarProps) {
  const router = useRouter();
  const [role, setRole] = useState<"admin" | "viewer">("viewer");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem("badminton_auction_role") as "admin" | "viewer" | null;
    if (savedRole) {
      setRole(savedRole);
    }
  }, []);

  const toggleRole = () => {
    const nextRole = role === "admin" ? "viewer" : "admin";
    setRole(nextRole);
    localStorage.setItem("badminton_auction_role", nextRole);
    if (nextRole === "admin") {
      router.push("/admin/live");
    } else {
      router.push("/admin/live");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("badminton_auction_role");
    setRole("viewer");
    router.push("/login");
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

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Left: Mobile Menu Toggle & Brand */}
        <div className="flex items-center gap-3">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Toggle navigation menu"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
              🏸
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base md:text-lg tracking-tight text-white group-hover:text-emerald-400 transition">
                  Hostel Day Badminton Auction
                </span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                  2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Live Player Auction • Hostel Day Celebration
              </p>
            </div>
          </Link>
        </div>

        {/* Right: Sound, Role indicator, Projector toggle, Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound Toggle */}
          <AudioControls />

          {/* Fullscreen / Projector Mode Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Projector Fullscreen Mode"}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">Projector Mode</span>
          </button>

          {/* Role Switcher */}
          <button
            onClick={toggleRole}
            title="Click to switch view between Admin and Viewer"
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-bold transition shadow-sm ${
              role === "admin"
                ? "bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20"
                : "bg-sky-500/10 border-sky-500/40 text-sky-400 hover:bg-sky-500/20"
            }`}
          >
            {role === "admin" ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>ADMIN</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-sky-400" />
                <span>VIEWER</span>
              </>
            )}
          </button>

          {/* Logout if admin */}
          {role === "admin" && (
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
