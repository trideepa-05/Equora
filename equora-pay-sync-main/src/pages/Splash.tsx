import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "@/assets/equora-logo.png";
import { useAuth } from "@/contexts/AuthContext";

const Splash = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    const target = isAuthenticated ? "/dashboard" : "/login";
    const timer = setTimeout(() => navigate(target, { replace: true }), 2000);
    return () => clearTimeout(timer);
  }, [navigate, isAuthenticated, isLoading]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      {/* Gold glow behind logo */}
      <div className="relative">
        <motion.div
          className="absolute inset-0 rounded-full animate-pulse-glow"
          style={{ margin: "-30px" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 1 }}
        />
        <motion.img
          src={logo}
          alt="Equora Logo"
          className="w-40 h-40 relative z-10"
          width={512}
          height={512}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <motion.p
        className="text-muted-foreground text-lg mt-6 tracking-widest uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        Smart Expense Settlement
      </motion.p>
      <motion.div
        className="mt-12 w-8 h-8 border border-primary/40 border-t-primary rounded-full animate-spin-slow"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      />
    </div>
  );
};

export default Splash;
