import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Link2, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";
import { useCurrency, formatCurrency, convertCurrency, CurrencyCode } from "@/lib/currency";
import { useAppData } from "@/lib/appData";

interface LedgerRow {
  id: string;
  from: string;
  to: string;
  amount: number;
  currency: CurrencyCode;
  timestamp: string;
  hash: string;
  status: string;
  chain?: string;
  proofTxId?: string;
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const Ledger = () => {
  const { baseCurrency } = useCurrency();
  const { payments, settlements, getUserById } = useAppData();
  const [rows, setRows] = useState<LedgerRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    const build = async () => {
      const paymentRows = await Promise.all(
        payments.map(async (p, index) => {
          const timestamp = p.completedAt || p.createdAt;
          const payload = `${p.fromUser}|${p.toUser}|${p.amount}|${timestamp}|${p.chain || "upi"}|${p.proofTxId || ""}|${index}`;
          const hash = await sha256Hex(payload);
          return {
            id: p.id,
            from: p.fromUser,
            to: p.toUser,
            amount: p.amount,
            currency: p.currency,
            timestamp,
            hash,
            status: p.status === "completed" ? "Confirmed" : "Pending",
            chain: p.chain,
            proofTxId: p.proofTxId,
          };
        })
      );

      const settlementRows = await Promise.all(
        settlements.map(async (s, index) => {
          const timestamp = s.completedAt || s.createdAt;
          const payload = `${s.fromUser}|${s.toUser}|${s.amount}|${timestamp}|settlement|${index}`;
          const hash = await sha256Hex(payload);
          return {
            id: `s-${s.id}`,
            from: s.fromUser,
            to: s.toUser,
            amount: s.amount,
            currency: s.currency,
            timestamp,
            hash,
            status: s.status === "completed" ? "Confirmed" : "Pending",
          } as LedgerRow;
        })
      );

      const nextRows = [...paymentRows, ...settlementRows].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      if (!cancelled) setRows(nextRows);
    };
    build();
    return () => {
      cancelled = true;
    };
  }, [payments, settlements]);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display gold-text flex items-center gap-2">
          <Link2 className="w-6 h-6 text-primary" /> Blockchain Ledger
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Simulated blockchain ledger with SHA256 proofs for every transaction.</p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-primary/60 px-5 py-3 uppercase tracking-wider">Transaction ID</th>
                <th className="text-left text-xs font-medium text-primary/60 px-5 py-3 uppercase tracking-wider">Paid By</th>
                <th className="text-left text-xs font-medium text-primary/60 px-5 py-3 uppercase tracking-wider">Amount</th>
                <th className="text-left text-xs font-medium text-primary/60 px-5 py-3 uppercase tracking-wider">Timestamp</th>
                <th className="text-left text-xs font-medium text-primary/60 px-5 py-3 uppercase tracking-wider">Status</th>
                <th className="text-left text-xs font-medium text-primary/60 px-5 py-3 uppercase tracking-wider">Proof</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No ledger transactions yet. Create a bill or settle a payment to generate blockchain proof rows.
                  </td>
                </tr>
              )}
              {rows.map((row) => {
                const txId = `TXN-${row.id.slice(0, 8).toUpperCase()}`;
                const from = getUserById(row.from);
                const to = getUserById(row.to);
                return (
                  <tr key={row.id} className="border-b border-border/50 hover:bg-primary/3 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-sm text-primary font-mono">{txId}</code>
                        <button onClick={() => { navigator.clipboard.writeText(txId); toast.success("Copied!"); }} className="text-muted-foreground hover:text-primary transition-colors">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{from?.name} → {to?.name}</td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-primary">{formatCurrency(row.amount, row.currency)}</p>
                      {row.currency !== baseCurrency && (
                        <p className="text-xs text-muted-foreground">≈ {formatCurrency(convertCurrency(row.amount, row.currency, baseCurrency), baseCurrency)}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{new Date(row.timestamp).toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className={row.status === "Confirmed" ? "status-paid" : "status-pending"}>{row.status}</span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        className="flex items-center gap-1 text-xs text-primary hover:text-secondary transition-colors"
                        onClick={() => {
                          navigator.clipboard.writeText(row.hash);
                          toast.success("SHA256 hash copied");
                        }}
                      >
                        <ExternalLink className="w-3 h-3" /> Verify
                      </button>
                      <p className="text-[10px] text-muted-foreground mt-1 font-mono">{row.hash.slice(0, 18)}...</p>
                      {row.chain === "algorand" && row.proofTxId && (
                        <div className="mt-2">
                          <p className="text-[10px] text-muted-foreground">Algorand tx</p>
                          <button
                            className="text-[10px] text-primary font-mono hover:underline"
                            onClick={() => {
                              navigator.clipboard.writeText(row.proofTxId || "");
                              toast.success("Tx id copied");
                            }}
                          >
                            {row.proofTxId.slice(0, 16)}...
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Ledger;
