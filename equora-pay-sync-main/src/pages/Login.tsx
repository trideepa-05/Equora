import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import logo from "@/assets/equora-logo.png";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signUp, error: authError, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          setError("Please enter your full name");
          setIsLoading(false);
          return;
        }
        await signUp(email, password, fullName);
      } else {
        await signIn(email, password);
      }
      navigate("/dashboard");
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : isSignUp
          ? "Failed to create account"
          : "Failed to sign in";
      setError(errorMsg);
      console.error("Auth error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/3" />
        <motion.div
          className="relative z-10 text-center px-12"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <img src={logo} alt="Equora" className="w-48 h-48 mx-auto mb-8" width={512} height={512} />
          <h2 className="text-3xl font-display gold-text mb-4">Split Bills Smartly</h2>
          <p className="text-muted-foreground text-lg max-w-md">
            Track shared expenses, settle payments instantly, and keep your group finances transparent.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            {["🍕 Food", "✈️ Travel", "🏠 Rent"].map((tag) => (
              <span key={tag} className="glass-card px-4 py-2 text-sm text-muted-foreground">{tag}</span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          className="w-full max-w-md glass-card p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <img src={logo} alt="Equora" className="w-16 h-16 mx-auto mb-4 lg:hidden" width={512} height={512} />
            <h1 className="text-2xl font-display gold-text">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              {isSignUp ? "Join Equora today" : "Sign in to your account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-[14px] px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
            {authError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-[14px] px-4 py-3 text-sm text-red-600">
                {authError}
              </div>
            )}
            {isSignUp && (
              <div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-input border border-border rounded-[14px] px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full bg-input border border-border rounded-[14px] pl-11 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full bg-input border border-border rounded-[14px] pl-11 pr-11 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {!isSignUp && (
              <div className="text-right">
                <button type="button" disabled={isLoading} className="text-sm text-primary/70 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Forgot password?</button>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full gold-btn text-base py-3.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary hover:text-secondary transition-colors font-medium">
              {isSignUp ? "Sign In" : "Create Account"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
