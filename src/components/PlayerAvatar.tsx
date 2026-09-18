"use client";

import React, { useState, useEffect } from "react";
import { Camera, Loader2 } from "lucide-react";
import { resolvePlayerPhoto } from "@/lib/utils";

interface PlayerAvatarProps {
  photo?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  editable?: boolean;
  playerId?: string;
  onPhotoUpdated?: (newUrl: string) => void;
}

export default function PlayerAvatar({
  photo,
  name,
  size = "md",
  className = "",
  editable = false,
  playerId,
  onPhotoUpdated,
}: PlayerAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Reset error if photo URL changes
  useEffect(() => {
    setHasError(false);
  }, [photo]);

  const sizeClasses = {
    sm: "w-9 h-9 rounded-xl text-xs",
    md: "w-12 h-12 rounded-2xl text-sm",
    lg: "w-24 h-24 rounded-3xl text-2xl",
    xl: "w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-3xl text-4xl",
  }[size];

  const initials = (name || "Player")
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (playerId) {
        formData.append("playerId", playerId);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.photoUrl) {
        setHasError(false);
        if (onPhotoUpdated) {
          onPhotoUpdated(json.photoUrl);
        }
      } else {
        alert(json.message || "Failed to upload photo");
      }
    } catch (err) {
      console.error("Photo upload error:", err);
      alert("Error uploading image file.");
    } finally {
      setIsUploading(false);
      // Reset input so same file can be chosen again if needed
      e.target.value = "";
    }
  };

  return (
    <div
      className={`relative group/avatar overflow-hidden bg-slate-900 border border-slate-700/80 flex items-center justify-center flex-shrink-0 shadow-md select-none ${sizeClasses} ${className}`}
    >
      {photo && !hasError ? (
        <img
          src={resolvePlayerPhoto(photo) || photo}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-800 to-slate-900 text-slate-300 font-black">
          <span>{initials || "🏸"}</span>
        </div>
      )}

      {/* Uploading Spinner */}
      {isUploading && (
        <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-emerald-400 z-10">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-[10px] font-bold mt-1 text-white">Saving...</span>
        </div>
      )}

      {/* Editable Hover Overlay */}
      {editable && !isUploading && (
        <label
          className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity duration-200 z-10 text-white"
          title="Upload or change player photo"
        >
          <Camera className={size === "sm" ? "w-3.5 h-3.5 text-emerald-400" : "w-6 h-6 text-emerald-400"} />
          <span className={size === "sm" ? "text-[8px] font-bold mt-0.5" : "text-xs font-bold mt-1"}>
            Upload
          </span>
          <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      )}
    </div>
  );
}
