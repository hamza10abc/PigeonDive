import { useId } from "react";

/** A feather in a dive: reads as a quill, a pigeon feather, and a paper dart at once. */
export function LogoMark({ size = 24, className = "" }: { size?: number; className?: string }) {
  // Unique per instance: a gradient inside a display:none copy (the hidden desktop header) would
  // otherwise shadow this one and render the mark empty.
  const gradient = `pd-sheen-${useId().replace(/:/g, "")}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={gradient} x1="3" y1="4" x2="21" y2="19" gradientUnits="userSpaceOnUse">
          <stop stopColor="#12A37F" />
          <stop offset="0.55" stopColor="#7FB84A" />
          <stop offset="1" stopColor="#E0B13C" />
        </linearGradient>
      </defs>
      <path d="M3.2 4.4C9.6 2.6 16.8 6.2 20.6 18.2 14.4 15.4 8.6 12.8 3.2 4.4Z" fill={`url(#${gradient})`} />
      <path d="M7 7.4c3.9 3.4 7.4 5.9 13.2 10.4" stroke="#ECEEEB" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark />
      <span className={`font-display text-[21px] leading-none tracking-tight ${light ? "text-white" : "text-ink"}`}>
        Pigeon<em className="italic">Dive</em>
      </span>
    </span>
  );
}
