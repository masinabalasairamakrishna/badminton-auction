"use client";

import React, { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { soundManager } from "@/lib/audio";

export default function AudioControls({ className = "" }: { className?: string }) {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(soundManager.isEnabled());
  }, []);

  const toggle = () => {
    const nextState = soundManager.toggleSound();
    setEnabled(nextState);
  };

  return (
    <button
      onClick={toggle}
      title={enabled ? "Sound is ON (Click to mute)" : "Sound is MUTED (Click to enable)"}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 ${
        enabled
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
          : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
      } ${className}`}
    >
      {enabled ? (
        <>
          <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Sound ON</span>
        </>
      ) : (
        <>
          <VolumeX className="w-4 h-4 text-slate-400" />
          <span>Sound OFF</span>
        </>
      )}
    </button>
  );
}
