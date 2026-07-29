"use client";

import { useState } from "react";
import { Copy, Download, Share2 } from "lucide-react";

type BusinessCardShareActionsProps = {
  cardUrl: string;
  cardTitle: string;
  vcardHref: string;
};

export function BusinessCardShareActions({
  cardUrl,
  cardTitle,
  vcardHref,
}: BusinessCardShareActionsProps) {
  const [copyLabel, setCopyLabel] = useState("Copy link");

  async function copyCardLink() {
    try {
      await navigator.clipboard.writeText(cardUrl);
      setCopyLabel("Copied");
      window.setTimeout(() => setCopyLabel("Copy link"), 1800);
    } catch {
      window.location.href = `mailto:?subject=${encodeURIComponent(cardTitle)}&body=${encodeURIComponent(cardUrl)}`;
    }
  }

  async function shareCard() {
    if (navigator.share) {
      await navigator.share({
        title: cardTitle,
        text: "Open this BNC Nearu digital business card.",
        url: cardUrl,
      });
      return;
    }

    await copyCardLink();
  }

  return (
    <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2">
      <button
        type="button"
        onClick={copyCardLink}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#143b75] px-4 text-[12px] font-black text-white transition hover:bg-[#0b2f74]"
      >
        <Copy className="h-4 w-4" />
        {copyLabel}
      </button>
      <button
        type="button"
        onClick={shareCard}
        className="grid h-11 w-11 place-items-center rounded-full border border-[#dfe6f2] text-[#143b75] transition hover:border-[#f4b227]"
        aria-label="Share business card"
      >
        <Share2 className="h-4 w-4" />
      </button>
      <a
        href={vcardHref}
        download="bnc-nearu-chams-global.vcf"
        className="grid h-11 w-11 place-items-center rounded-full border border-[#dfe6f2] text-[#143b75] transition hover:border-[#f4b227]"
        aria-label="Download business card contact"
      >
        <Download className="h-4 w-4" />
      </a>
    </div>
  );
}
