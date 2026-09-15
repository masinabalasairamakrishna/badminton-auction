"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy,
  Plus,
  Edit2,
  Trash2,
  Users,
  Shield,
  IndianRupee,
  Eye,
  CheckCircle2,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Team, Player, DatabaseSchema } from "@/types";
import { useToast } from "@/components/Toast";
import { formatCurrency } from "@/lib/utils";
import PlayerAvatar from "@/components/PlayerAvatar";

export default function TeamsManagementPage() {
  const { success, error } = useToast();

  const [db, setDb] = useState<DatabaseSchema | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [selectedSquadTeam, setSelectedSquadTeam] = useState<Team | null>(null);

  // Form states
  const [formData, setFormData] = useState<Partial<Team>>({
    name: "",
    logo: "🏸",
    color: "#10b981",
    captain: "",
    initialBudget: 1000,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auction/state");
      const json = await res.json();
      if (json.success && json.data) {
        setDb(json.data);
      }
    } catch {
      error("Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingTeam(null);
    setFormData({
      name: "",
      logo: "🏸",
      color: "#10b981",
      captain: "",
      initialBudget: 1000,
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({ ...team });
    setIsAddEditOpen(true);
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      error("Team name is required.");
      return;
    }

    try {
      const method = editingTeam ? "PUT" : "POST";
      const payload = editingTeam ? { ...formData, id: editingTeam.id } : formData;

      const res = await fetch("/api/teams", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        success(editingTeam ? "Team updated successfully!" : "New franchise team created!");
        setIsAddEditOpen(false);
        loadData();
      } else {
        error(data.message || "Failed to save team.");
      }
    } catch {
      error("Error saving team.");
    }
  };

  const handleDeleteTeam = async (team: Team) => {
    if (confirm(`Are you sure you want to delete ${team.name}?`)) {
      try {
        const res = await fetch(`/api/teams?id=${team.id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          success(`Deleted team ${team.name}`);
          loadData();
        } else {
          error(data.message || "Could not delete team");
        }
      } catch {
        error("Error deleting team.");
      }
    }
  };

  if (!db) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh] text-emerald-400 font-bold animate-pulse">
          Loading Teams & Squad Purses...
        </div>
      </DashboardLayout>
    );
  }

  const { teams, players, settings } = db;
  const currency = settings.currency || "coins";

  return (
    <DashboardLayout>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Franchise Team Management</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {teams.length} Teams
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure tournament franchises, assign team captains, and track purse budgets.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-95"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>Add New Team</span>
        </button>
      </div>

      {/* Grid of Team Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {teams.map((team) => {
          const percent = Math.min(100, Math.round((team.spent / team.initialBudget) * 100));
          const teamRoster = players.filter((p) => p.soldTo === team.id);

          return (
            <div
              key={team.id}
              className="card-glass rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div>
                {/* Header: Logo, Name, Edit/Delete */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border border-slate-700 bg-slate-900 shadow-md"
                      style={{ borderColor: team.color }}
                    >
                      {team.logo || "🏸"}
                    </div>
                    <div>
                      <h2
                        className="text-lg font-black tracking-tight"
                        style={{ color: team.color || "#ffffff" }}
                      >
                        {team.name}
                      </h2>
                      <span className="text-xs text-slate-400 font-semibold block">
                        Captain: {team.captain}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(team)}
                      title="Edit Team"
                      className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(team)}
                      title="Delete Team"
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Budget Details Grid */}
                <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 mb-4 text-center font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Budget</span>
                    <span className="text-xs font-bold text-slate-200">
                      {formatCurrency(team.initialBudget, currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Spent</span>
                    <span className="text-xs font-bold text-amber-400">
                      {formatCurrency(team.spent, currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Remaining</span>
                    <span className="text-xs font-bold text-emerald-400">
                      {formatCurrency(team.remainingBudget, currency)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Purse Exhaustion</span>
                    <span className="font-bold text-slate-300">{percent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* View Squad Button */}
              <button
                onClick={() => setSelectedSquadTeam(team)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <Users className="w-4 h-4 text-sky-400" />
                <span>View Full Squad ({teamRoster.length} Players)</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Team Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 md:p-8 shadow-2xl">
            <h2 className="text-xl font-black text-white mb-4">
              {editingTeam ? `Edit ${editingTeam.name}` : "Create New Franchise Team"}
            </h2>

            <form onSubmit={handleSaveTeam} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Team Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Smash Warriors"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">Team Icon / Emoji</label>
                  <input
                    type="text"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    placeholder="🏸"
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm text-center"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">Team Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.color || "#10b981"}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-10 h-10 rounded-xl border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color || "#10b981"}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Team Captain *</label>
                <input
                  type="text"
                  required
                  value={formData.captain}
                  onChange={(e) => setFormData({ ...formData, captain: e.target.value })}
                  placeholder="e.g. Sai Teja (Block A)"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">
                  Initial Budget ({db?.settings.currency || "coins"}) *
                </label>
                <input
                  type="number"
                  min="100"
                  step="50"
                  required
                  value={formData.initialBudget}
                  onChange={(e) => setFormData({ ...formData, initialBudget: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black"
                >
                  {editingTeam ? "Save Changes" : "Create Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Squad Modal (Section 18) */}
      {selectedSquadTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 md:p-8 shadow-2xl max-h-[90vh] flex flex-col">
            <button
              onClick={() => setSelectedSquadTeam(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Squad Header */}
            <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-800">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border border-slate-700 bg-slate-950"
                style={{ borderColor: selectedSquadTeam.color }}
              >
                {selectedSquadTeam.logo || "🏸"}
              </div>
              <div>
                <h2
                  className="text-2xl font-black text-white"
                  style={{ color: selectedSquadTeam.color }}
                >
                  {selectedSquadTeam.name} Squad
                </h2>
                <p className="text-xs text-slate-400">
                  Captain: <span className="text-slate-200 font-semibold">{selectedSquadTeam.captain}</span> • Remaining Budget: <span className="text-emerald-400 font-mono font-bold">{formatCurrency(selectedSquadTeam.remainingBudget, currency)}</span>
                </p>
              </div>
            </div>

            {/* Roster List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {players.filter((p) => p.soldTo === selectedSquadTeam.id).length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm">
                  No players acquired by {selectedSquadTeam.name} yet.
                </div>
              ) : (
                players
                  .filter((p) => p.soldTo === selectedSquadTeam.id)
                  .map((player, idx) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-500 w-5">{idx + 1}.</span>
                        <PlayerAvatar
                          photo={player.photo}
                          name={player.name}
                          size="sm"
                        />
                        <div>
                          <span className="font-extrabold text-sm text-white block">{player.name}</span>
                          <span className="text-[11px] text-slate-400">
                            {player.branch} • {player.playingType} • {player.skillLevel}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase block">Hammer Price</span>
                        <span className="font-mono font-black text-sm text-amber-400">
                          {formatCurrency(player.finalPrice, currency)}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
