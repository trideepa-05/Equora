import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send } from "lucide-react";
import { useAppData } from "@/lib/appData";
import { useCurrency, formatCurrency } from "@/lib/currency";
import { calculateSettlements } from "@/lib/settlement";

const quickReplies = [
  "Show my pending payments",
  "Settle up suggestions",
  "How to split bills?",
];

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: "Hi! I'm Equora Assistant ✨ How can I help you with your expenses today?" },
  ]);
  const [input, setInput] = useState("");
  const { expenses, payments, settlements, getUserById } = useAppData();
  const { baseCurrency } = useCurrency();

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setTimeout(() => {
      let reply = "I can help you manage bills, track payments, settle debts, and more!";

      if (text.toLowerCase().includes("pending")) {
        const unpaid = payments.filter((p) => p.status !== "completed");
        if (unpaid.length === 0) {
          reply = "Great news — everyone is paid up. 🎉";
        } else {
          const lines = unpaid.slice(0, 5).map((p) => {
            const from = getUserById(p.fromUser)?.name || "Unknown";
            return `• ${from} owes ${formatCurrency(p.amount, p.currency)}`;
          });
          reply = `Pending members (${unpaid.length}):\n\n${lines.join("\n")}`;
        }
      } else if (text.toLowerCase().includes("settle")) {
        const suggestions = calculateSettlements(expenses, baseCurrency, settlements);
        if (suggestions.length === 0) {
          reply = "🎉 All settled! No pending balances.";
        } else {
          const lines = suggestions.map((s) => {
            const from = getUserById(s.fromUser);
            const to = getUserById(s.toUser);
            return `• ${from?.name} → ${to?.name}: ${formatCurrency(s.amount, baseCurrency)}`;
          });
          reply = `💡 You have pending balances. Here are the optimized settlements:\n\n${lines.join("\n")}\n\nGo to Settle Up to complete them!`;
        }
      } else if (text.toLowerCase().includes("create") || text.toLowerCase().includes("bill")) {
        reply = "To create a bill, go to 'Create Bill' from the sidebar. You can:\n• Select currency (INR/USD/EUR/GBP)\n• Pick participants from your contacts\n• Split equally, by percentage, or custom amounts!";
      } else if (text.toLowerCase().includes("split")) {
        reply = "Equora supports 3 split types:\n1. Equal Split\n2. Percentage Split\n3. Custom Split\n\nAll with multi-currency conversion!";
      } else if (text.toLowerCase().includes("currency")) {
        reply = `Your base currency is ${baseCurrency}. You can change it in Settings → Currency Preferences.\n\nSupported: INR (₹), USD ($), EUR (€), GBP (£)`;
      } else if (text.toLowerCase().includes("total expense") || text.toLowerCase().includes("total")) {
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        reply = `Your total tracked expense is ${formatCurrency(total, expenses[0]?.currency || "USD")} across ${expenses.length} bills.`;
      } else if (text.toLowerCase().includes("who hasn't paid") || text.toLowerCase().includes("who hasnt paid")) {
        const unpaidNames = payments
          .filter((p) => p.status !== "completed")
          .map((p) => getUserById(p.fromUser)?.name || "Unknown");
        const unique = Array.from(new Set(unpaidNames));
        reply = unique.length
          ? `Members still pending payment: ${unique.join(", ")}`
          : "Everyone has already paid. ✅";
      }

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    }, 800);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 sm:right-6 w-[340px] max-h-[500px] glass-card flex flex-col z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-border bg-primary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold gold-text">Equora Assistant</p>
                    <p className="text-xs text-muted-foreground">Online</p>
                  </div>
                </div>
                <button aria-label="Close chat" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-72">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm whitespace-pre-line ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground border border-border"
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-border">
              <div className="flex gap-1 mb-2 flex-wrap">
                {quickReplies.map((q) => (
                  <button key={q} onClick={() => sendMessage(q)} className="text-xs bg-primary/5 border border-primary/20 px-2 py-1 rounded-full text-primary/70 hover:text-primary hover:border-primary/40 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                  placeholder="Ask something..."
                  className="flex-1 bg-input border border-border rounded-[10px] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
                />
                <button aria-label="Send message" onClick={() => sendMessage(input)} className="p-2 rounded-[10px] bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 sm:right-6 z-50 w-14 h-14 rounded-full bg-card border-2 border-primary/40 text-primary flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 hover:border-primary/70 gold-glow"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </>
  );
};

export default Chatbot;
