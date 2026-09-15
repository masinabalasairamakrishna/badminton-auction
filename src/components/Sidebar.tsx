"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Radio,
  Users,
  Trophy,
  ListOrdered,
  History,
  BarChart3,
  Medal,
  Settings,
  LogOut,
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, badge: null },
    { label: "Live Auction", href: "/admin/live", icon: Radio, badge: "LIVE", badgeColor: "bg-red-500 text-white animate-pulse" },
    { label: "Players", href: "/admin/players", icon: Users, badge: null },
    { label: "Teams", href: "/admin/teams", icon: Trophy, badge: null },
    { label: "Auction Queue", href: "/admin/queue", icon: ListOrdered, badge: null },
    { label: "Bid History", href: "/admin/history", icon: History, badge: null },
    { label: "Results", href: "/results", icon: BarChart3, badge: null },
    { label: "Leaderboard", href: "/leaderboard", icon: Medal, badge: null },
    { label: "Settings", href: "/admin/settings", icon: Settings, badge: null },
  ];

  const handleLogout = () => {
    localStorage.removeItem("badminton_auction_role");
    router.push("/login");
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 ease-in-out flex flex-col justify-between ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Navigation list */}
        <div className="p-4 space-y-1.5 overflow-y-auto flex-1">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Tournament Arena
          </div>

          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer info & logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Logout</span>
          </button>

          <div className="mt-3 text-[11px] text-slate-500 text-center">
            Hostel Day Badminton Auction 2026
          </div>
        </div>
      </aside>
    </>
  );
}
