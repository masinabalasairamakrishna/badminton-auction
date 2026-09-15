"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpDown,
  Download,
  UploadCloud,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Player, PlayingType, SkillLevel, PlayerStatus } from "@/types";
import { useToast } from "@/components/Toast";
import PlayerCardModal from "@/components/PlayerCardModal";
import PlayerAvatar from "@/components/PlayerAvatar";
import { formatCurrency } from "@/lib/utils";

export default function PlayersManagementPage() {
  const { success, error, info } = useToast();

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [skillFilter, setSkillFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"queueOrder" | "name" | "basePrice">("queueOrder");

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [viewingPlayer, setViewingPlayer] = useState<Player | null>(null);
  const [isDownloadingPhotos, setIsDownloadingPhotos] = useState(false);
  const [isDriveHelpOpen, setIsDriveHelpOpen] = useState(false);

  // Sync modal inputs
  const [syncTab, setSyncTab] = useState<"url" | "paste">("url");
  const [syncSheetId, setSyncSheetId] = useState("");
  const [syncCsvUrl, setSyncCsvUrl] = useState("");
  const [pastedRawData, setPastedRawData] = useState("");
  const [syncMode, setSyncMode] = useState<"append" | "replace">("append");
  const [isSyncing, setIsSyncing] = useState(false);

  // Add/Edit Form state
  const [formData, setFormData] = useState<Partial<Player>>({
    name: "",
    rollNumber: "",
    branch: "CSE",
    year: "3rd",
    gender: "Male",
    playingType: "Both",
    skillLevel: "Intermediate",
    basePrice: 20,
    photo: "",
    notes: "",
  });

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/players");
      const json = await res.json();
      if (json.success) {
        setPlayers(json.players);
      }
    } catch {
      error("Failed to load players");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const handleMakeImagesPermanent = async () => {
    setIsDownloadingPhotos(true);
    try {
      const res = await fetch("/api/players/download-photos", { method: "POST" });
      const json = await res.json();
      if (json.success && json.downloadedCount > 0) {
        success(`Saved ${json.downloadedCount} player photo(s) permanently to local disk!`);
        await loadPlayers();
      } else {
        setIsDriveHelpOpen(true);
      }
    } catch {
      error("Failed to download photos");
    } finally {
      setIsDownloadingPhotos(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingPlayer(null);
    setFormData({
      name: "",
      rollNumber: `21CS${Math.floor(100 + Math.random() * 900)}`,
      branch: "CSE",
      year: "3rd",
      gender: "Male",
      playingType: "Both",
      skillLevel: "Intermediate",
      basePrice: 20,
      photo: "",
      notes: "",
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (player: Player) => {
    setEditingPlayer(player);
    setFormData({ ...player });
    setIsAddEditOpen(true);
  };

  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      error("Player name is required.");
      return;
    }

    try {
      const method = editingPlayer ? "PUT" : "POST";
      const payload = editingPlayer ? { ...formData, id: editingPlayer.id } : formData;

      const res = await fetch("/api/players", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        success(editingPlayer ? "Player updated successfully!" : "New player added successfully!");
        setIsAddEditOpen(false);
        loadPlayers();
      } else {
        error(data.message || "Failed to save player.");
      }
    } catch {
      error("Error saving player.");
    }
  };

  const handleDeletePlayer = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        const res = await fetch(`/api/players?id=${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          success(`Deleted player ${name}`);
          loadPlayers();
        } else {
          error(data.message || "Could not delete player");
        }
      } catch {
        error("Error deleting player.");
      }
    }
  };

  const handleSyncGoogleSheets = async () => {
    if (syncTab === "url" && !syncSheetId.trim()) {
      error("Please enter a Google Sheet Link or ID.");
      return;
    }
    if (syncTab === "paste" && !pastedRawData.trim()) {
      error("Please paste your spreadsheet data or CSV.");
      return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch("/api/sheets/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sheetId: syncTab === "url" ? syncSheetId.trim() : undefined,
          rawContent: syncTab === "paste" ? pastedRawData.trim() : undefined,
          mode: syncMode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        success(data.message);
        setIsSyncModalOpen(false);
        setPastedRawData("");
        loadPlayers();
      } else {
        error(data.message || "Google Sheets synchronization failed.");
      }
    } catch {
      error("Network error during synchronization.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter and sort logic
  const filteredPlayers = players
    .filter((p) => {
      const matchesQuery =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.branch.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "All" || p.status === statusFilter;
      const matchesType = typeFilter === "All" || p.playingType === typeFilter;
      const matchesSkill = skillFilter === "All" || p.skillLevel === skillFilter;
      const matchesBranch = branchFilter === "All" || p.branch === branchFilter;

      return matchesQuery && matchesStatus && matchesType && matchesSkill && matchesBranch;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "basePrice") return b.basePrice - a.basePrice;
      return a.queueOrder - b.queueOrder;
    });

  const branches = Array.from(new Set(players.map((p) => p.branch))).sort();

  return (
    <DashboardLayout>
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Player Registry</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
              {players.length} Players
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Search, filter, register, and synchronize players from Google Sheets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleMakeImagesPermanent}
            disabled={isDownloadingPhotos}
            className="px-4 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition disabled:opacity-50"
            title="Download and save all player photos permanently to local disk"
          >
            <Download className={`w-4 h-4 ${isDownloadingPhotos ? "animate-bounce" : ""}`} />
            <span>{isDownloadingPhotos ? "Saving Photos..." : "Permanent Photos"}</span>
          </button>

          <button
            onClick={() => setIsDriveHelpOpen(true)}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
            title="How to fix Google Drive photos"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Sync Google Sheet</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Add Player</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-glass rounded-2xl p-4 border border-slate-800 mb-6 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, roll no, branch..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-emerald-400 transition"
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-200 text-xs focus:outline-hidden focus:border-emerald-400"
            >
              <option value="All">Status: All</option>
              <option value="Available">Available</option>
              <option value="Live">Live</option>
              <option value="Sold">Sold</option>
              <option value="Unsold">Unsold</option>
            </select>
          </div>

          {/* Playing Type Filter */}
          <div className="md:col-span-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-200 text-xs focus:outline-hidden focus:border-emerald-400"
            >
              <option value="All">Type: All</option>
              <option value="Singles">Singles</option>
              <option value="Doubles">Doubles</option>
              <option value="Both">Both</option>
            </select>
          </div>

          {/* Skill Level Filter */}
          <div className="md:col-span-2">
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-200 text-xs focus:outline-hidden focus:border-emerald-400"
            >
              <option value="All">Skill: All</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "queueOrder" | "name" | "basePrice")}
              className="w-full py-2 px-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-200 text-xs focus:outline-hidden focus:border-emerald-400"
            >
              <option value="queueOrder">Sort: Auction Order</option>
              <option value="name">Sort: Player Name</option>
              <option value="basePrice">Sort: Base Price</option>
            </select>
          </div>
        </div>
      </div>

      {/* Players Table */}
      <div className="card-glass rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm animate-pulse">
            Loading tournament players...
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No players match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 bg-slate-900/70">
                <tr>
                  <th className="py-3.5 px-4 font-extrabold">#</th>
                  <th className="py-3.5 px-4 font-extrabold">Player</th>
                  <th className="py-3.5 px-4 font-extrabold">Branch / Year</th>
                  <th className="py-3.5 px-4 font-extrabold">Type</th>
                  <th className="py-3.5 px-4 font-extrabold">Skill</th>
                  <th className="py-3.5 px-4 font-extrabold text-right">Base Price</th>
                  <th className="py-3.5 px-4 font-extrabold text-center">Status</th>
                  <th className="py-3.5 px-4 font-extrabold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPlayers.map((player) => {
                  let badge = "bg-slate-800 text-slate-300 border-slate-700";
                  if (player.status === "Available") badge = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
                  else if (player.status === "Live") badge = "bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse";
                  else if (player.status === "Sold") badge = "bg-teal-500/15 text-teal-400 border-teal-500/30";
                  else if (player.status === "Unsold") {
                    badge = player.unsoldRound === 1
                      ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                      : "bg-rose-500/15 text-rose-400 border-rose-500/30";
                  }

                  return (
                    <tr key={player.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">
                        #{player.queueOrder}
                      </td>

                      {/* Photo & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <PlayerAvatar
                            photo={player.photo}
                            name={player.name}
                            size="sm"
                            editable={true}
                            playerId={player.id}
                            onPhotoUpdated={(newUrl) => {
                              player.photo = newUrl;
                              loadPlayers();
                              success(`Photo for ${player.name} saved permanently!`);
                            }}
                          />
                          <div>
                            <button
                              onClick={() => setViewingPlayer(player)}
                              className="font-bold text-white hover:text-emerald-400 text-sm text-left transition"
                            >
                              {player.name}
                            </button>
                            <span className="text-[11px] font-mono text-slate-400 block">
                              {player.rollNumber}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-xs">
                        <span className="font-semibold text-slate-200">{player.branch}</span>
                        <span className="text-slate-400 ml-1.5">• {player.year} Year</span>
                      </td>

                      <td className="py-3 px-4 text-xs font-semibold text-sky-400">
                        {player.playingType}
                      </td>

                      <td className="py-3 px-4 text-xs font-semibold text-emerald-400">
                        {player.skillLevel}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-black text-amber-400">
                        {formatCurrency(player.basePrice, "coins")}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${badge}`}>
                          {player.status === "Unsold" && player.unsoldRound === 1 ? "Unsold (R2 Pending)" : player.status}
                        </span>
                        {player.soldToTeamName && (
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            {player.soldToTeamName}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setViewingPlayer(player)}
                            title="View Player Profile"
                            className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(player)}
                            title="Edit Player"
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePlayer(player.id, player.name)}
                            title="Delete Player"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black text-white mb-4">
              {editingPlayer ? `Edit ${editingPlayer.name}` : "Register New Player"}
            </h2>

            <form onSubmit={handleSavePlayer} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Player Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sai Krishna"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">Roll Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    placeholder="21CS101"
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">Branch</label>
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    placeholder="CSE"
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">Year</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  >
                    <option value="1st">1st Year</option>
                    <option value="2nd">2nd Year</option>
                    <option value="3rd">3rd Year</option>
                    <option value="4th">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as "Male" | "Female" })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">Base Price (Coins) *</label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">Playing Type</label>
                  <select
                    value={formData.playingType}
                    onChange={(e) => setFormData({ ...formData, playingType: e.target.value as PlayingType })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  >
                    <option value="Singles">Singles</option>
                    <option value="Doubles">Doubles</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">Skill Level</label>
                  <select
                    value={formData.skillLevel}
                    onChange={(e) => setFormData({ ...formData, skillLevel: e.target.value as SkillLevel })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Player Photo</label>
                <div className="flex items-center gap-3">
                  <PlayerAvatar
                    photo={formData.photo}
                    name={formData.name || "Player"}
                    size="md"
                  />
                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 font-bold text-xs cursor-pointer transition">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload Photo from Device (Permanent)</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const data = new FormData();
                            data.append("file", file);
                            if (editingPlayer?.id) {
                              data.append("playerId", editingPlayer.id);
                            }
                            const res = await fetch("/api/upload", { method: "POST", body: data });
                            const json = await res.json();
                            if (json.success && json.photoUrl) {
                              setFormData((prev) => ({ ...prev, photo: json.photoUrl }));
                              success("Photo uploaded permanently!");
                            } else {
                              error(json.message || "Failed to upload photo");
                            }
                          } catch {
                            error("Error uploading file");
                          }
                        }}
                      />
                    </label>
                    <input
                      type="url"
                      value={formData.photo || ""}
                      onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                      placeholder="Or paste direct image URL..."
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Scouting Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Strong backhand, Inter-hostel medal winner..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
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
                  {editingPlayer ? "Save Changes" : "Create Player"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Sheets Sync Modal */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 md:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Sync Players from Google Sheet</h2>
                <p className="text-xs text-slate-400">Import Google Form player registrations automatically</p>
              </div>
            </div>

            {/* Method Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 mb-4">
              <button
                type="button"
                onClick={() => setSyncTab("url")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  syncTab === "url"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>Google Sheet Link</span>
              </button>
              <button
                type="button"
                onClick={() => setSyncTab("paste")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  syncTab === "paste"
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>Paste Data Directly</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-normal">Easy</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {syncTab === "url" ? (
                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">
                    Google Sheet Link or ID
                  </label>
                  <input
                    type="text"
                    value={syncSheetId}
                    onChange={(e) => setSyncSheetId(e.target.value)}
                    placeholder="Paste Google Sheet URL (Share link or Publish to web link)"
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-hidden focus:border-emerald-400"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block leading-relaxed">
                    💡 <b>Works with:</b> Any Google Sheet link! Just ensure Google Sheet <b>Share</b> is set to <i>"Anyone with the link can view"</i> or <b>File &gt; Share &gt; Publish to web</b>.
                  </span>
                </div>
              ) : (
                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">
                    Paste Rows Directly from Google Sheet
                  </label>
                  <textarea
                    rows={5}
                    value={pastedRawData}
                    onChange={(e) => setPastedRawData(e.target.value)}
                    placeholder="In your Google Sheet, select all cells with data (Ctrl+A or drag), copy (Ctrl+C), and paste here..."
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-hidden focus:border-teal-400"
                  />
                  <span className="text-[11px] text-teal-400/90 mt-1 block">
                    ✨ <b>Zero permissions needed:</b> Simply copy the table directly from your spreadsheet and paste it here!
                  </span>
                </div>
              )}

              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Sync Strategy</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSyncMode("append")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                      syncMode === "append"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                        : "bg-slate-800 border-slate-700 text-slate-400"
                    }`}
                  >
                    Append New Players Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setSyncMode("replace")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                      syncMode === "replace"
                        ? "bg-amber-500/20 border-amber-500 text-amber-400"
                        : "bg-slate-800 border-slate-700 text-slate-400"
                    }`}
                  >
                    Replace All Players
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 text-slate-400 text-[11px] space-y-1">
                <span className="font-bold text-slate-300 block">Accepted Google Form Columns:</span>
                <div>• Player Name, Roll Number, Branch, Year, Gender, Playing Type, Skill Level, Base Price</div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={handleSyncGoogleSheets}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black flex items-center gap-2 disabled:opacity-50"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Sync Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Photo Fix & Permanent Storage Guidance Modal */}
      {isDriveHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg card-glass rounded-3xl p-6 border border-slate-700 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                  🖼️
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Make Player Images Permanent</h3>
                  <span className="text-[11px] text-slate-400">Why Google Drive photos break when tabs close &amp; how to fix</span>
                </div>
              </div>
              <button
                onClick={() => setIsDriveHelpOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1">
                <span className="font-extrabold flex items-center gap-1.5 text-sm text-amber-400">
                  <ShieldAlert className="w-4 h-4" />
                  Why do Google Drive photos break when the tab closes?
                </span>
                <p className="leading-relaxed text-[11px] text-amber-200/90">
                  When players upload photos via Google Form, Google Drive sets that responses folder to <b>Restricted</b> by default.
                  Your browser only showed images while you were actively logged into Google in another tab. Browsers also block 3rd-party cookies for security, breaking images on other devices.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-extrabold text-white text-sm block">
                  Option 1: Fix All Photos in 15 Seconds (Recommended)
                </span>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-300">
                  <li>Open your <b>Google Drive</b> in your browser.</li>
                  <li>Find the form upload folder: <code className="bg-slate-900 px-1 py-0.5 rounded text-emerald-400">ANVAYA 2K26 – Badminton Tournament Player Registration (File responses)</code></li>
                  <li><b>Right-click</b> that folder &rarr; click <b>Share</b>.</li>
                  <li>Under <b>General access</b>, change from <b>Restricted</b> to <b>&quot;Anyone with the link&quot;</b> (Role: <b>Viewer</b>).</li>
                  <li>Click <b>Done</b>.</li>
                </ol>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setIsDriveHelpOpen(false);
                      handleMakeImagesPermanent();
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>I Made It Public &mdash; Save Photos to Disk Now</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="font-extrabold text-white text-sm block">
                  Option 2: Direct Upload from Computer
                </span>
                <p className="text-slate-400 text-[11px]">
                  You can also upload any player&apos;s photo directly! Just <b>hover over any player&apos;s avatar in the table</b> and click <b>Upload</b>, or click <b>Edit</b> to choose a file from your device. It will be stored 100% permanently on the server disk!
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsDriveHelpOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player Card Details Modal */}
      <PlayerCardModal
        player={viewingPlayer}
        onClose={() => setViewingPlayer(null)}
      />
    </DashboardLayout>
  );
}
