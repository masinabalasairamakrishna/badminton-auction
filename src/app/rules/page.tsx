"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Printer, Copy, Check, ArrowLeft, Radio, Download, Share2 } from "lucide-react";
import { BADMINTON_AUCTION_RULES, TOURNAMENT_RULES_HEADER, WHATSAPP_RULES_TEXT } from "@/lib/rulesData";

export default function RulesPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(WHATSAPP_RULES_TEXT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#070e17] text-slate-100 selection:bg-emerald-500 selection:text-slate-950 font-sans print:bg-white print:text-black">
      {/* Screen-only Navigation Bar */}
      <header className="print:hidden border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/live"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Auction Arena</span>
          </Link>

          <div>
            <span className="text-xs font-black text-white block">
              {TOURNAMENT_RULES_HEADER.event} Official Rules
            </span>
            <span className="text-[10px] text-slate-400">Hostel Day Badminton Tournament 2026</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition flex items-center gap-1.5 shadow-sm"
            title="Copy formatted text for WhatsApp"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span>{copied ? "Copied for WhatsApp!" : "Copy for WhatsApp"}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 print:p-0 print:max-w-none">
        {/* Document Sheet (Styled to match the PDF on screen and paper) */}
        <article className="bg-white text-slate-900 rounded-2xl p-6 sm:p-12 shadow-2xl border border-slate-200 print:shadow-none print:border-none print:p-8 print:rounded-none">
          {/* Document Header */}
          <div className="text-center mb-8 pb-6 border-b-2 border-slate-900">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-950 uppercase mb-2">
              {TOURNAMENT_RULES_HEADER.event}
            </h1>
            <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-800 uppercase tracking-wide">
              {TOURNAMENT_RULES_HEADER.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium italic">
              {TOURNAMENT_RULES_HEADER.subtitle}
            </p>
          </div>

          {/* Numbered Rules List matching the official PDF format */}
          <ol className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-900">
            {BADMINTON_AUCTION_RULES.map((rule) => (
              <li key={rule.id} className="flex items-start gap-2">
                <span className="font-bold min-w-[28px] text-right">{rule.id}.</span>
                <div>
                  <strong className="font-extrabold text-slate-950">{rule.title}:</strong>{" "}
                  <span className="text-slate-800">{rule.description}</span>
                </div>
              </li>
            ))}
          </ol>

          {/* Footer Note */}
          <div className="mt-10 pt-6 border-t border-slate-300 text-center">
            <p className="text-xs sm:text-sm font-semibold text-slate-700 italic">
              {TOURNAMENT_RULES_HEADER.footer}
            </p>
          </div>

          {/* Official Signatures Bar (Only for print / official look) */}
          <div className="mt-12 pt-8 flex justify-between items-center text-xs text-slate-600 border-t border-dashed border-slate-300">
            <div>
              <p className="font-bold text-slate-900">Tournament Committee</p>
              <p className="text-[11px] text-slate-500">Hostel Day Sports Council 2026</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-900">Official Gavel & Scorer</p>
              <p className="text-[11px] text-slate-500">Live Auction Protocol</p>
            </div>
          </div>
        </article>

        {/* Screen Bottom Actions */}
        <div className="print:hidden mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <p className="text-xs text-slate-400">
            Tip: You can press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300">Ctrl + P</kbd> anytime to print or save this document as a PDF.
          </p>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/live"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Enter Live Auction</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
