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
    sm: "w-10 h-10 sm:w-11 sm:h-11 rounded-xl text-xs",
    md: "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl text-base",
    lg: "w-28 h-28 sm:w-36 sm:h-36 rounded-3xl text-3xl",
    xl: "w-52 h-52 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-3xl text-5xl",
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
