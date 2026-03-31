import DashboardLayout from "@/components/DashboardLayout";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { useCurrency, formatCurrency, convertCurrency, getCurrencySymbol } from "@/lib/currency";
import { useAppData } from "@/lib/appData";

const COLORS = ["#D4AF37", "#F5D27A", "#8B7021", "#C9A227", "#3A3A3A", "#E8C547"];

const tooltipStyle = { background: "#121212", border: "1px solid hsl(43,30%,18%)", borderRadius: 14, color: "#f2f2f2" };

const Analytics = () => {
  const { baseCurrency } = useCurrency();
  const { expenses, getUserById } = useAppData();
  const sym = getCurrencySymbol(baseCurrency);

  // Category breakdown
  const categoryMap = new Map<string, number>();
  for (const exp of expenses) {
    const cat = exp.category.replace(/[^\w\s]/g, "").trim() || "Other";
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + convertCurrency(exp.amount, exp.currency, baseCurrency));
  }
  const categoryData = Array.from(categoryMap.entries()).map(([name, value], i) => ({
    name, value: Math.round(value), color: COLORS[i % COLORS.length],
  }));
  const totalSpend = categoryData.reduce((sum, item) => sum + item.value, 0);
  const topCategory = [...categoryData].sort((a, b) => b.value - a.value)[0];
  const topPct = topCategory && totalSpend > 0 ? Math.round((topCategory.value / totalSpend) * 100) : 0;

  // Payer breakdown
  const payerMap = new Map<string, number>();
  for (const exp of expenses) {
    const name = getUserById(exp.paidBy)?.name || "Unknown";
    payerMap.set(name, (payerMap.get(name) || 0) + convertCurrency(exp.amount, exp.currency, baseCurrency));
  }
  const payerData = Array.from(payerMap.entries()).map(([name, amount]) => ({
    name, amount: Math.round(amount),
  }));

  // Expense history (conversion log style)
  const historyData = expenses.map((exp) => ({
    title: exp.title.slice(0, 15),
    amount: Math.round(convertCurrency(exp.amount, exp.currency, baseCurrency)),
  }));

  const formatTick = (v: number) => `${sym}${v.toLocaleString()}`;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display gold-text">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Spending patterns and insights · Displayed in {baseCurrency}</p>
      </div>

      <div className="glass-card p-4 mb-6">
        <p className="text-sm text-foreground">
          {topCategory
            ? `Insight: You spend heavily on ${topCategory.name} (${topPct}% of total spend).`
            : "Insight: Add more expenses to unlock spending patterns."}
        </p>
      </div>

      {/* Expense History / Conversion Log */}
      <div className="glass-card p-5 mb-6">
        <h2 className="font-display gold-text text-lg mb-4">Expense History & Conversion Log</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-primary/60 px-3 py-2 uppercase">Expense</th>
                <th className="text-left text-xs font-medium text-primary/60 px-3 py-2 uppercase">Original</th>
                <th className="text-left text-xs font-medium text-primary/60 px-3 py-2 uppercase">Converted ({baseCurrency})</th>
                <th className="text-left text-xs font-medium text-primary/60 px-3 py-2 uppercase">Rate</th>
                <th className="text-left text-xs font-medium text-primary/60 px-3 py-2 uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id} className="border-b border-border/50 hover:bg-primary/3 transition-colors">
                  <td className="px-3 py-3 text-sm text-foreground">{exp.title}</td>
                  <td className="px-3 py-3 text-sm text-primary font-medium">{formatCurrency(exp.amount, exp.currency)}</td>
                  <td className="px-3 py-3 text-sm text-muted-foreground">{formatCurrency(convertCurrency(exp.amount, exp.currency, baseCurrency), baseCurrency)}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground font-mono">1 {exp.currency} = {convertCurrency(1, exp.currency, baseCurrency).toFixed(4)} {baseCurrency}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{new Date(exp.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h2 className="font-display gold-text text-lg mb-4">Expenses by Category</h2>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" stroke="none">
                  {categoryData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v, baseCurrency)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {categoryData.map((c) => (
              <div key={c.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                {c.name}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="font-display gold-text text-lg mb-4">Most Active Payers</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payerData}>
                <XAxis dataKey="name" tick={{ fill: "#8c8c8c", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#8c8c8c", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatTick} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v, baseCurrency)} />
                <Bar dataKey="amount" fill="#D4AF37" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
