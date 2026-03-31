type IllustrationVariant = "empty" | "success";

export default function Illustration({ variant }: { variant: IllustrationVariant }) {
  if (variant === "success") {
    return (
      <svg viewBox="0 0 320 220" className="w-full max-w-[280px] h-auto" role="img" aria-label="Success">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#D4AF37" stopOpacity="0.95" />
            <stop offset="1" stopColor="#F5D76E" stopOpacity="0.95" />
          </linearGradient>
          <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect x="24" y="28" width="272" height="164" rx="20" fill="#121212" stroke="rgba(212,175,55,0.25)" />
        <circle cx="160" cy="110" r="54" fill="rgba(212,175,55,0.08)" />
        <path
          d="M135 112l14 14 36-40"
          fill="none"
          stroke="url(#g)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
        />
        <path d="M70 64h76" stroke="rgba(234,234,234,0.16)" strokeWidth="6" strokeLinecap="round" />
        <path d="M70 84h56" stroke="rgba(234,234,234,0.10)" strokeWidth="6" strokeLinecap="round" />
        <path d="M174 148h76" stroke="rgba(234,234,234,0.12)" strokeWidth="6" strokeLinecap="round" />
      </svg>
    );
  }

  // empty
  return (
    <svg viewBox="0 0 320 220" className="w-full max-w-[280px] h-auto" role="img" aria-label="Empty state">
      <defs>
        <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#D4AF37" stopOpacity="0.85" />
          <stop offset="1" stopColor="#F5D76E" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <rect x="24" y="28" width="272" height="164" rx="20" fill="#121212" stroke="rgba(212,175,55,0.18)" />
      <path d="M58 72h204" stroke="rgba(234,234,234,0.10)" strokeWidth="6" strokeLinecap="round" />
      <path d="M58 96h164" stroke="rgba(234,234,234,0.07)" strokeWidth="6" strokeLinecap="round" />
      <path d="M58 120h188" stroke="rgba(234,234,234,0.06)" strokeWidth="6" strokeLinecap="round" />
      <circle cx="92" cy="154" r="18" fill="rgba(212,175,55,0.10)" />
      <path
        d="M84 154h16"
        stroke="url(#g2)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M160 154h84"
        stroke="rgba(234,234,234,0.08)"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

