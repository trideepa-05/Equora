import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { Receipt, Clock, CheckCircle2, ArrowRight, Sparkles, Handshake } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrency, formatCurrency, convertCurrency } from "@/lib/currency";
import { useAppData } from "@/lib/appData";
import { calculateSettlements, calculateBalances } from "@/lib/settlement";

const Dashboard = () => {
  const { baseCurrency } = useCurrency();
  const { expenses, bills, payments, settlements, users, currentUser, getUserById } = useAppData();

  const balances = calculateBalances(expenses, baseCurrency);
  const suggestions = calculateSettlements(expenses, baseCurrency, settlements);

  const totalAmount = expenses.reduce((sum, e) => sum + convertCurrency(e.amount, e.currency, baseCurrency), 0);
  const myBalance = balances[currentUser.id] || 0;
  const pendingSettlements = suggestions.length;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display gold-text">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your shared expenses</p>
      </div>

      {/* AI Hint Banner */}
      {pendingSettlements > 0 && (
        <div className="glass-card p-4 mb-6 flex items-start gap-3 border-primary/30">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">You have pending balances</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Settle now to simplify payments. We've optimized to just {pendingSettlements} transaction{pendingSettlements !== 1 ? "s" : ""}.
            </p>
          </div>
          <Link to="/settle" className="gold-btn text-xs !px-4 !py-2 whitespace-nowrap">Settle Up</Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Bills" value={String(expenses.length)} icon={Receipt} trend="+3 this month" />
        <StatCard
          title="Your Balance"
          value={`${myBalance >= 0 ? "+" : ""}${formatCurrency(Math.abs(myBalance), baseCurrency)}`}
          icon={myBalance >= 0 ? CheckCircle2 : Clock}
          trend={myBalance >= 0 ? "You're owed" : "You owe"}
        />
        <StatCard title="Pending Settlements" value={String(pendingSettlements)} icon={Handshake} />
        <StatCard title="Total Split" value={formatCurrency(totalAmount, baseCurrency)} icon={Receipt} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Bills Overview */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display gold-text text-lg">All Bills</h2>
              <Link to="/create-bill" className="text-sm text-primary/70 hover:text-primary flex items-center gap-1 transition-colors">New Bill <ArrowRight className="w-3 h-3" /></Link>
            </div>
            {bills.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bills yet. Create your first bill to get started.</p>
            ) : (
              <div className="space-y-3">
                {bills.slice(0, 6).map((bill) => {
                  const billPayments = payments.filter((p) => p.billId === bill.id);
                  const paidCount = 1 + billPayments.filter((p) => p.status === "completed").length;
                  const totalCount = bill.participants.length;
                  const isComplete = totalCount > 0 && paidCount >= totalCount;
                  return (
                    <Link
                      to={`/bill/${bill.id}`}
                      key={bill.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors border border-transparent hover:border-primary/10"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{bill.title}</p>
                        <p className="text-xs text-muted-foreground">{bill.category} · {paidCount}/{totalCount} paid</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary">{formatCurrency(bill.totalAmount, bill.currency)}</p>
                        <span className={isComplete ? "status-paid" : "status-pending"}>
                          {isComplete ? "Completed" : "Pending"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Who Owes Whom */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display gold-text text-lg">Who Owes Whom</h2>
              <Link to="/settle" className="text-sm text-primary/70 hover:text-primary flex items-center gap-1 transition-colors">Settle Up <ArrowRight className="w-3 h-3" /></Link>
            </div>
            {suggestions.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-10 h-10 text-primary/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">All settled! 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.slice(0, 5).map((s, i) => {
                  const from = getUserById(s.fromUser);
                  const to = getUserById(s.toUser);
                  return (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors border border-transparent hover:border-primary/10">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full border border-destructive/30 flex items-center justify-center text-destructive text-xs font-semibold bg-destructive/10">
                          {from?.name.charAt(0)}
                        </div>
                        <span className="text-sm text-foreground">{from?.name}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <div className="w-7 h-7 rounded-full border border-green-500/30 flex items-center justify-center text-green-400 text-xs font-semibold bg-green-500/10">
                          {to?.name.charAt(0)}
                        </div>
                        <span className="text-sm text-foreground">{to?.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-primary">{formatCurrency(s.amount, baseCurrency)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Expenses */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display gold-text text-lg">Recent Expenses</h2>
              <Link to="/payments" className="text-sm text-primary/70 hover:text-primary flex items-center gap-1 transition-colors">View All <ArrowRight className="w-3 h-3" /></Link>
            </div>
            <div className="space-y-3">
              {expenses.slice(0, 4).map((exp) => {
                const payer = getUserById(exp.paidBy);
                return (
                  <div key={exp.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors border border-transparent hover:border-primary/10">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{exp.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Paid by {payer?.name} · {exp.category} · {new Date(exp.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">{formatCurrency(exp.amount, exp.currency)}</p>
                      {exp.currency !== baseCurrency && (
                        <p className="text-xs text-muted-foreground">≈ {formatCurrency(convertCurrency(exp.amount, exp.currency, baseCurrency), baseCurrency)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="glass-card p-5">
            <h2 className="font-display gold-text text-lg mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link to="/create-bill" className="block gold-btn text-center text-sm">+ Create New Bill</Link>
              <Link to="/settle" className="block gold-btn-outline text-center text-sm">⚡ Settle Up</Link>
              <Link to="/groups" className="block glass-card-hover p-3 text-center text-sm text-foreground">Manage Groups</Link>
              <Link to="/analytics" className="block glass-card-hover p-3 text-center text-sm text-foreground">View Analytics</Link>
            </div>
          </div>

          {/* Per-User Balances */}
          <div className="glass-card p-5">
            <h2 className="font-display gold-text text-lg mb-4">Balance Summary</h2>
            <div className="space-y-2">
              {users.map((user) => {
                const bal = balances[user.id] || 0;
                const isPositive = bal > 0.01;
                const isNegative = bal < -0.01;
                return (
                  <div key={user.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full border border-primary/30 flex items-center justify-center text-primary text-xs font-semibold bg-primary/10">
                        {user.name.charAt(0)}
                      </div>
                      <p className="text-xs font-medium text-foreground">{user.name}</p>
                    </div>
                    <span className={`text-xs font-semibold ${isPositive ? "text-green-400" : isNegative ? "text-destructive" : "text-muted-foreground"}`}>
                      {isPositive ? "+" : ""}{formatCurrency(Math.abs(bal), baseCurrency)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
