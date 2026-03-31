import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Handshake, ArrowRight, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAppData } from "@/lib/appData";
import { useCurrency, formatCurrency } from "@/lib/currency";

const SettleUp = () => {
  const { expenses, bills, settlements, users, currentUser, addSettlement, updateSettlementStatus, getUserById, calculateBalances, simplifyDebts } = useAppData();

  // 🧮 Calculate balances from BOTH bills and expenses
  const balances = calculateBalances(bills, expenses);
  const suggestions = simplifyDebts(balances);
  const { baseCurrency } = useCurrency();

  const handleSettle = (fromUser: string, toUser: string, amount: number) => {
    addSettlement({
      fromUser,
      toUser,
      amount,
      currency: baseCurrency,
      status: "pending",
      expenseIds: [...expenses.map((e) => e.id), ...bills.map((b) => b.id)],
    });
    toast.success("Settlement created!", {
      description: `${getUserById(fromUser)?.name} → ${getUserById(toUser)?.name}: ${formatCurrency(amount, baseCurrency)}`,
    });
  };

  const handleComplete = (id: string) => {
    updateSettlementStatus(id, "completed");
    toast.success("Settlement marked as completed! ✅");
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display gold-text flex items-center gap-2">
          <Handshake className="w-6 h-6 text-primary" /> Settle Up
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Optimize and settle debts with minimum transactions</p>
      </div>

      {/* AI Suggestion Banner */}
      {suggestions.length > 0 && (
        <div className="glass-card p-4 mb-6 flex items-start gap-3 border-primary/30">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Smart Settlement Suggestion</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You have {suggestions.length} pending balance{suggestions.length !== 1 ? "s" : ""}. Settle now to simplify payments — we've optimized to minimize the number of transactions.
            </p>
          </div>
        </div>
      )}

      {/* User Balances */}
      <div className="glass-card p-5 mb-6">
        <h2 className="font-display gold-text text-lg mb-4">User Balances</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {users.map((user) => {
            const balance = balances[user.id] || 0;
            const isPositive = balance > 0.01;
            const isNegative = balance < -0.01;
            return (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full border-2 border-primary/30 flex items-center justify-center text-primary font-semibold text-xs bg-primary/10">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {isPositive ? "Gets back" : isNegative ? "Owes" : "Settled"}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${isPositive ? "text-green-400" : isNegative ? "text-destructive" : "text-muted-foreground"}`}>
                  {isPositive ? "+" : ""}{formatCurrency(Math.abs(balance), baseCurrency)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settlement Suggestions */}
      <div className="glass-card p-5 mb-6">
        <h2 className="font-display gold-text text-lg mb-4">Optimized Settlements</h2>
        {suggestions.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-primary/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">All settled up! No pending transactions.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s, i) => {
              const from = getUserById(s.from);
              const to = getUserById(s.to);
              // Check if there's already a pending settlement for this pair
              const existing = settlements.find(
                (st) => st.fromUser === s.from && st.toUser === s.to && st.status === "pending"
              );
              return (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-muted/40 border border-border gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-9 h-9 rounded-full border-2 border-destructive/40 flex items-center justify-center text-destructive font-semibold text-xs bg-destructive/10">
                      {from?.name.charAt(0)}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">{from?.name}</p>
                      <p className="text-xs text-muted-foreground">pays</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                    <div className="w-9 h-9 rounded-full border-2 border-green-500/40 flex items-center justify-center text-green-400 font-semibold text-xs bg-green-500/10">
                      {to?.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{to?.name}</p>
                      <p className="text-xs text-muted-foreground">receives</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-display gold-text font-bold">{formatCurrency(s.amount, baseCurrency)}</span>
                    {existing ? (
                      <span className="status-pending flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
                    ) : (
                      <button
                        onClick={() => handleSettle(s.from, s.to, s.amount)}
                        className="gold-btn text-xs !px-4 !py-2"
                      >
                        Settle Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Settlement History */}
      {settlements.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="font-display gold-text text-lg mb-4">Settlement History</h2>
          <div className="space-y-3">
            {settlements.map((s) => {
              const from = getUserById(s.fromUser);
              const to = getUserById(s.toUser);
              return (
                <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-muted/40 border border-border gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-foreground">{from?.name}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className="font-medium text-foreground">{to?.name}</span>
                    <span className="text-primary font-semibold">{formatCurrency(s.amount, s.currency)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                    {s.status === "completed" ? (
                      <span className="status-paid flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="status-pending flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
                        <button
                          onClick={() => handleComplete(s.id)}
                          className="text-xs text-primary hover:text-secondary transition-colors underline"
                        >
                          Mark Done
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default SettleUp;
