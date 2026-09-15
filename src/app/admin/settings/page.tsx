"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  RotateCcw,
  Volume2,
  VolumeX,
  Clock,
  IndianRupee,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { TournamentSettings } from "@/types";
import { soundManager } from "@/lib/audio";
import { useToast } from "@/components/Toast";

export default function SettingsPage() {
  const { success, error, info } = useToast();

  const [settings, setSettings] = useState<TournamentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.success) {
        setSettings(json.settings);
      }
    } catch {
      error("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        success("Tournament settings saved successfully!");
      } else {
        error(data.message || "Failed to save settings.");
      }
    } catch {
      error("Network error while saving settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAll = async () => {
    if (
      confirm(
        "⚠️ DANGER: Are you sure you want to reset ALL tournament data, teams, players, and auction history back to the initial sample dataset?"
      )
    ) {
      try {
        const res = await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "RESET_ALL" }),
        });
        const data = await res.json();
        if (data.success) {
          success("Tournament reset to original sample state successfully!");
          loadSettings();
        } else {
          error(data.message || "Failed to reset database.");
        }
      } catch {
        error("Network error during reset.");
      }
    }
  };

  if (!settings) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh] text-emerald-400 font-bold animate-pulse">
          Loading Settings Console...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Tournament Settings</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Admin Configuration
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure tournament titles, auction timer countdowns, bidding increments, and database controls.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Settings Form */}
        <div className="lg:col-span-8 card-glass rounded-3xl p-6 md:p-8 border border-slate-800 shadow-xl">
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <h2 className="text-base font-black text-white mb-4">
                Tournament Branding
              </h2>
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">
                    Tournament Name
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.tournamentName}
                    onChange={(e) =>
                      setSettings({ ...settings, tournamentName: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">
                    Tournament Subtitle / Theme
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.subtitle}
                    onChange={(e) =>
                      setSettings({ ...settings, subtitle: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold uppercase text-slate-400 mb-1">
                      Currency Symbol
                    </label>
                    <input
                      type="text"
                      required
                      value={settings.currency}
                      onChange={(e) =>
                        setSettings({ ...settings, currency: e.target.value })
                      }
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold uppercase text-slate-400 mb-1">
                      Default Base Price ({settings.currency})
                    </label>
                    <input
                      type="number"
                      required
                      min="10"
                      step="10"
                      value={settings.defaultBasePrice}
                      onChange={(e) =>
                        setSettings({ ...settings, defaultBasePrice: Number(e.target.value) })
                      }
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <h2 className="text-base font-black text-white mb-4">
                Auction Engine & Timer Rules
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">
                    Countdown Timer Duration (Seconds)
                  </label>
                  <input
                    type="number"
                    required
                    min="5"
                    max="1800"
                    value={settings.auctionTimer}
                    onChange={(e) =>
                      setSettings({ ...settings, auctionTimer: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm font-mono font-bold"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    e.g. 600s (10 min) or 30s. Automatically resets on every valid bid.
                  </span>
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">
                    Squad Size Limits (Min / Max)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={settings.minSquadSize}
                      onChange={(e) =>
                        setSettings({ ...settings, minSquadSize: Number(e.target.value) })
                      }
                      className="w-1/2 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm font-mono"
                      placeholder="Min"
                    />
                    <span className="text-slate-400 font-bold">to</span>
                    <input
                      type="number"
                      min="1"
                      value={settings.maxSquadSize}
                      onChange={(e) =>
                        setSettings({ ...settings, maxSquadSize: Number(e.target.value) })
                      }
                      className="w-1/2 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm font-mono"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-slate-950" />
                <span>{isSaving ? "Saving..." : "Save Settings"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone & Reset Card */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Sound Preview Card */}
          <div className="card-glass rounded-3xl p-6 border border-slate-800">
            <h3 className="text-sm font-black text-white mb-2 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Audio Synthesizer Test</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Test Web Audio effects used in the live stadium.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => soundManager.playBidSound()}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
              >
                Bid Chime
              </button>
              <button
                onClick={() => soundManager.playWarningTick()}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
              >
                Timer Tick
              </button>
              <button
                onClick={() => soundManager.playSoldFanfare()}
                className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-bold transition"
              >
                Sold Fanfare
              </button>
              <button
                onClick={() => soundManager.playUnsoldGavel()}
                className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-xs font-bold transition"
              >
                Unsold Gavel
              </button>
            </div>
          </div>

          {/* Database Danger Zone */}
          <div className="card-glass rounded-3xl p-6 border border-rose-900/60 bg-rose-950/10">
            <h3 className="text-sm font-black text-rose-400 mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              <span>Tournament Reset Zone</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Need to restart the auction from scratch or load fresh sample data for rehearsal?
            </p>

            <button
              onClick={handleResetAll}
              className="w-full py-3 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset to Sample Dataset</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
