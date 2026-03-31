import { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

const AnimatedButton = ({ children, className = "", ...props }: AnimatedButtonProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 220, damping: 16 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default AnimatedButton;
