import { ReactNode } from "react";
import { motion } from "framer-motion";

interface PremiumCardProps {
  children: ReactNode;
  className?: string;
}

const PremiumCard = ({ children, className = "" }: PremiumCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
      className={`premium-card relative overflow-hidden ${className}`}
    >
      {/* decorative blurred gold circle (behind content) */}
      <div
        className="absolute -top-20 -right-20 w-52 h-52 rounded-full blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(212,175,55,0.22), transparent 62%)",
        }}
      />
      <div className="relative">{children}</div>
    </motion.div>
  );
};

export default PremiumCard;
