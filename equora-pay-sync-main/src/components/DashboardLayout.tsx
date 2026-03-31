import { ReactNode, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, PlusCircle, Users, CreditCard, BarChart3,
  Link2, Settings, Search, Bell, Menu, X, LogOut, Handshake,
} from "lucide-react";
import logo from "@/assets/equora-logo.png";
import Chatbot from "./Chatbot";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAppData } from "@/lib/appData";
import Illustration from "@/components/Illustration";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Create Bill", url: "/create-bill", icon: PlusCircle },
  { title: "Groups", url: "/groups", icon: Users },
  { title: "Payments", url: "/payments", icon: CreditCard },
  { title: "Settle Up", url: "/settle", icon: Handshake },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Scan Barcode", url: "/scan", icon: Search },
  { title: "Blockchain Ledger", url: "/ledger", icon: Link2 },
  { title: "Settings", url: "/settings", icon: Settings },
];

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { payments, expenses, currentUser, getUserById } = useAppData();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);

  const initials = (user?.displayName || user?.email || "User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  const handleSearch = () => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;
    const target = navItems.find((item) => item.title.toLowerCase().includes(query));
    if (!target) {
      toast.error("No matching page found");
      return;
    }
    navigate(target.url);
    setSearchQuery("");
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to logout";
      toast.error("Logout failed", { description: message });
    }
  };

  const notifications = useMemo(() => {
    const myPending = payments.filter(
      (p) => p.fromUser === currentUser.id && p.status !== "completed"
    );
    return myPending.slice(0, 10).map((p) => {
      const bill = expenses.find((e) => e.id === p.billId);
      const to = getUserById(p.toUser);
      return {
        id: p.id,
        title: bill?.title || "Payment request",
        subtitle: `Pay ${to?.name || "member"}`,
        amount: `${p.amount} ${p.currency}`,
      };
    });
  }, [payments, currentUser.id, expenses, getUserById]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-5 flex items-center gap-3 border-b border-border">
          <img src={logo} alt="Equora" className="w-9 h-9" width={512} height={512} />
          <span className="text-xl font-display gold-text">Equora</span>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.url;
            return (
              <motion.div key={item.url} whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                <Link
                  to={item.url}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-primary/10 text-primary border border-primary/20 gold-glow"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.title}
                </Link>
              </motion.div>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-background/70 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-card/60 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-muted-foreground hover:text-primary transition-colors">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search bills, groups..."
                className="bg-input border border-border rounded-[10px] pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 w-64 transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setNotifOpen(true)}
              title="Notifications"
              aria-label="Notifications"
              className="relative p-2 rounded-[10px] hover:bg-primary/5 transition-colors text-primary/60 hover:text-primary"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full gold-glow" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="hidden md:block text-right">
                <p className="text-xs text-foreground">{user?.displayName || "Account"}</p>
                <p className="text-[11px] text-muted-foreground">{user?.email || "Not signed in"}</p>
              </div>
              <button
                onClick={() => navigate("/profile")}
                className="w-9 h-9 rounded-full border-2 border-primary/40 flex items-center justify-center text-primary font-semibold text-sm bg-primary/10 hover:bg-primary/15 transition-colors"
                title="Profile"
                aria-label="Profile"
              >
                {initials || "U"}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      <Chatbot />

      <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
        <SheetContent side="right" className="bg-[#0B0B0B] gold-border">
          <SheetHeader>
            <SheetTitle className="gold-text">Notifications</SheetTitle>
          </SheetHeader>
          <div className="mt-5 space-y-3">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center text-center gap-4 py-10">
                <Illustration variant="empty" />
                <div>
                  <p className="text-sm text-foreground">No notifications</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You’re all caught up. Pending payment requests will appear here.
                  </p>
                </div>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="premium-card p-4">
                  <p className="text-sm text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{n.subtitle}</p>
                  <p className="text-xs text-primary mt-2">{n.amount}</p>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DashboardLayout;
