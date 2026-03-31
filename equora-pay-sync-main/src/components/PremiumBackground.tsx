import { ReactNode } from "react";
import { motion } from "framer-motion";

const patternSvg = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <defs>
    <pattern id="p" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
      <path d="M0 18H36" stroke="rgba(212,175,55,0.08)" stroke-width="1"/>
      <path d="M18 0V36" stroke="rgba(212,175,55,0.05)" stroke-width="1"/>
      <circle cx="18" cy="18" r="1.2" fill="rgba(245,215,110,0.10)"/>
    </pattern>
  </defs>
  <rect width="180" height="180" fill="url(#p)"/>
</svg>
`);

export default function PremiumBackground({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0B0B0B] text-[#EAEAEA]">
      {/* Radial gold glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(900px 500px at 20% 0%, rgba(212,175,55,0.18), transparent 55%), radial-gradient(700px 500px at 90% 30%, rgba(245,215,110,0.10), transparent 60%)",
        }}
      />

      {/* Subtle SVG pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.22]"
        style={{
          backgroundImage: `url("data:image/svg+xml,${patternSvg}")`,
          backgroundRepeat: "repeat",
        }}
      />

      {/* Floating orbs */}
      <motion.div
        className="absolute -top-24 -left-24 w-80 h-80 rounded-full pointer-events-none blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(212,175,55,0.24), transparent 65%)" }}
        animate={{ x: [0, 24, -10, 0], y: [0, 18, 6, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -right-28 w-96 h-96 rounded-full pointer-events-none blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(245,215,110,0.16), transparent 60%)" }}
        animate={{ x: [0, -18, 10, 0], y: [0, -12, 12, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-180px] left-1/3 w-[520px] h-[520px] rounded-full pointer-events-none blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(212,175,55,0.14), transparent 62%)" }}
        animate={{ x: [0, 10, -14, 0], y: [0, 10, -6, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}

