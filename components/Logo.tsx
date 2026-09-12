export function Mark({ size = 44, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lx-tile" x1="14" y1="10" x2="114" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#b8ff4a" />
          <stop offset="0.55" stopColor="#45dcff" />
          <stop offset="1" stopColor="#ff4fa3" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="112" height="112" rx="30" fill="url(#lx-tile)" />
      <path d="M40 30h19v37h31v19H40z" fill="#07060f" />
      <circle cx="34" cy="101" r="5.5" fill="#07060f" />
      <circle cx="64" cy="101" r="5.5" fill="#07060f" fillOpacity="0.55" />
      <circle cx="94" cy="101" r="5.5" fill="#07060f" fillOpacity="0.3" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-extrabold tracking-tight ${className}`}>
      <Mark size={30} />
      <span>
        Lexi<span className="text-lime">roll</span>
      </span>
    </span>
  );
}
