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
        <linearGradient id="wj-tile" x1="14" y1="10" x2="114" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#b8ff4a" />
          <stop offset="0.55" stopColor="#45dcff" />
          <stop offset="1" stopColor="#ff4fa3" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="112" height="112" rx="30" fill="url(#wj-tile)" />
      <rect x="8" y="8" width="112" height="112" rx="30" fill="#07060f" fillOpacity="0.1" />
      <path
        d="M28 40l11.5 44h11L64 52.5 77.5 84h11L100 40H88.5l-6 26.5L70 40h-12L45.5 66.5 39.5 40z"
        fill="#07060f"
      />
      <circle cx="34" cy="100" r="5.5" fill="#07060f" />
      <circle cx="64" cy="100" r="5.5" fill="#07060f" fillOpacity="0.55" />
      <circle cx="94" cy="100" r="5.5" fill="#07060f" fillOpacity="0.3" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-extrabold tracking-tight ${className}`}>
      <Mark size={30} />
      <span>
        Wort<span className="text-lime">jagd</span>
      </span>
    </span>
  );
}
