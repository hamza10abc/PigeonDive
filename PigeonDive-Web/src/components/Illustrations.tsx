/** Small line illustrations, drawn for this app (not stock), used in empty states. */

export function DartPath({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 120" fill="none" className={className} aria-hidden="true">
      <path d="M8 98C54 98 70 30 118 38s54 44 94 -22" stroke="#C4C9C3" strokeWidth="1.5" strokeDasharray="3 6" strokeLinecap="round" />
      <circle cx="8" cy="98" r="4" fill="#fff" stroke="#848B87" strokeWidth="1.5" />
      <g transform="translate(196 6) rotate(-28)">
        <path d="M0 8 18 0 14 16 9 11Z" fill="#111418" />
        <path d="M9 11 18 0" stroke="#ECEEEB" strokeWidth="1" />
      </g>
    </svg>
  );
}

export function EmptyTemplates({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" className={className} aria-hidden="true">
      <rect x="22" y="22" width="84" height="78" rx="6" fill="#fff" stroke="#C4C9C3" strokeWidth="1.5" />
      <rect x="34" y="36" width="40" height="5" rx="2.5" fill="#D9DDD8" />
      <rect x="34" y="48" width="58" height="4" rx="2" fill="#E4E7E3" />
      <rect x="34" y="58" width="52" height="4" rx="2" fill="#E4E7E3" />
      <rect x="34" y="76" width="26" height="10" rx="5" fill="#111418" />
      <rect x="62" y="12" width="84" height="78" rx="6" fill="#F6F7F5" stroke="#C4C9C3" strokeWidth="1.5" strokeDasharray="3 5" />
      <path d="M96 40v22M85 51h22" stroke="#848B87" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyActivity({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 110" fill="none" className={className} aria-hidden="true">
      <path d="M10 88h140" stroke="#C4C9C3" strokeWidth="1.5" strokeDasharray="3 5" strokeLinecap="round" />
      <path d="M22 88c10-34 36-52 70-48 18 2 32 10 46 26" stroke="#C4C9C3" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="22" cy="88" r="4.5" fill="#fff" stroke="#848B87" strokeWidth="1.5" />
      <circle cx="138" cy="66" r="4.5" fill="#fff" stroke="#848B87" strokeWidth="1.5" />
      <g transform="translate(82 28) rotate(8)">
        <path d="M0 9 22 0 17 19 11 13Z" fill="#111418" />
        <path d="M11 13 22 0" stroke="#ECEEEB" strokeWidth="1" />
      </g>
    </svg>
  );
}
