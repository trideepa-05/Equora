import DashboardLayout from "@/components/DashboardLayout";
import { Bell, QrCode } from "lucide-react";
import { toast } from "sonner";
import { useCurrency, formatCurrency, convertCurrency } from "@/lib/currency";
import { useAppData } from "@/lib/appData";
import PaymentButton from "@/components/PaymentButton";
import PremiumCard from "@/components/ui/PremiumCard";
import { useState } from "react";
import LottiePlayer from "@/components/LottiePlayer";
import { generateUpiQrUrl } from "@/lib/upi";

const Payments = () => {
  const { baseCurrency } = useCurrency();
  const { expenses, payments, getUserById, updatePaymentStatus, verifyAlgorandPayment } = useAppData();
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [txId, setTxId] = useState<Record<string, string>>({});
  const [qrOpenFor, setQrOpenFor] = useState<string | null>(null);
  const [asaId, setAsaId] = useState<Record<string, string>>({});

  const sendReminder = (
    name: string,
    amount: number,
    currency: string,
    bill: string
  ) => {
    toast.success(`Reminder sent to ${name}!`, {
      description: `Hey! You still owe ${formatCurrency(amount, currency)} for ${bill}`,
    });
  };

  const toggleStatus = async (paymentId: string, isCompleted: boolean) => {
    await updatePaymentStatus(paymentId, isCompleted ? "pending" : "completed");
    toast.success(isCompleted ? "Marked as pending" : "Marked as paid");
  };

  const totalPending = payments.filter((p) => p.status !== "completed").length;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display gold-text">
          Payment Requests
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track and manage payment status
        </p>
      </div>

      <div className="mb-5 rounded-xl border border-yellow-500/20 bg-[#121212]/70 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <span className="text-sm text-foreground">Notification Center</span>
        </div>
        <span className="text-xs text-primary/90">
          {totalPending} pending payment{totalPending === 1 ? "" : "s"}
        </span>
      </div>

      <div className="space-y-6">
        {expenses.map((exp) => {
          const payer = getUserById(exp.paidBy);
          const expensePayments = payments.filter((p) => p.billId === exp.id);
          const completedCount = expensePayments.filter((p) => p.status === "completed").length;
          const totalMembers = exp.splitBetween.length;
          const paidCount = 1 + completedCount; // payer is considered paid
          const progress = totalMembers > 0 ? (paidCount / totalMembers) * 100 : 0;

          return (
            <PremiumCard key={exp.id} className="p-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <div>
                  <h2 className="font-display gold-text">
                    {exp.title}
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Total: {formatCurrency(exp.amount, exp.currency)}

                    {exp.currency !== baseCurrency && (
                      <span className="ml-1 text-primary/50">
                        ≈{" "}
                        {formatCurrency(
                          convertCurrency(
                            exp.amount,
                            exp.currency,
                            baseCurrency
                          ),
                          baseCurrency
                        )}
                      </span>
                    )}

                    <span className="ml-2">
                      · Paid by {payer?.name || "Unknown"}
                    </span>
                  </p>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <span className="text-sm text-primary/70 whitespace-nowrap">
                    {paidCount}/{totalMembers} paid
                  </span>
                </div>
              </div>

              {/* Members */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exp.splitBetween.map((split) => {
                  const member = getUserById(split.userId);
                  const isPayer = split.userId === exp.paidBy;
                  const payment = expensePayments.find((p) => p.fromUser === split.userId);
                  const isCompleted = payment?.status === "completed";
                  const isVerifyOpen = payment && verifyingId === payment.id;
                  const isQrOpen = payment && qrOpenFor === payment.id;
                  const qrUrl =
                    member?.upiId && member.upiId.includes("@")
                      ? generateUpiQrUrl(member.upiId, member.name || "Member", split.amount)
                      : "";

                  return (
                    <div
                      key={split.userId}
                      className="p-4 rounded-xl border border-yellow-500/20 bg-[#121212]/70 hover:border-yellow-500/30 transition-colors min-h-[100px]"
                    >
                      <div className="flex justify-between items-center gap-4">
                        {/* Left */}
                        <div className="flex flex-col gap-1 min-w-0 pr-3">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {member?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(split.amount, exp.currency)}
                          </p>
                          <div>
                            {isPayer || isCompleted ? (
                              <span className="text-xs px-2 py-1 rounded-full w-fit border border-[rgba(212,175,55,0.30)] bg-[rgba(212,175,55,0.12)] text-primary">
                                Paid
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded-full w-fit border border-border bg-muted/40 text-muted-foreground">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right */}
                        <div className="grid grid-cols-[minmax(140px,1fr)_40px_minmax(120px,1fr)] gap-3 items-center shrink-0 min-w-[320px]">
                          <PaymentButton
                            upiId={member?.upiId}
                            recipientName={member?.name || "Member"}
                            amount={split.amount}
                            currency={exp.currency}
                            status={isPayer ? "completed" : isCompleted ? "completed" : "pending"}
                            heightClassName="h-10"
                            payButtonClassName="min-w-[140px] gold-btn !py-0 !px-4 text-black"
                            markPaidButtonClassName="min-w-[140px] gold-btn !py-0 !px-4 text-black"
                            onMarkPaid={async () => {
                              if (!payment) return;
                              await toggleStatus(payment.id, isCompleted);
                            }}
                          />

                          <button
                            type="button"
                            onClick={() => {
                              if (!payment) return;
                              setQrOpenFor((prev) => {
                                const next = prev === payment.id ? null : payment.id;
                                if (next) setVerifyingId(null);
                                return next;
                              });
                            }}
                            disabled={!payment || !qrUrl || isPayer}
                            className="h-10 w-10 rounded-full border border-yellow-500/20 text-primary/90 hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            title="UPI QR"
                            aria-label="UPI QR"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          <button
                            className="h-10 min-w-[140px] text-xs px-4 rounded border border-yellow-500/25 text-primary/90 hover:bg-primary/10 transition-colors"
                            onClick={() => {
                              if (!payment) return;
                              setVerifyingId((prev) => {
                                const next = prev === payment.id ? null : payment.id;
                                if (next) setQrOpenFor(null);
                                return next;
                              });
                            }}
                            disabled={!payment || isPayer}
                            title="Verify by Algorand tx id"
                          >
                            Verify
                          </button>
                        </div>
                      </div>

                      {/* Verify panel (inside card, no overflow) */}
                      {payment && isVerifyOpen && (
                        <div className="mt-3 premium-card p-4 w-full gold-border rounded-xl">
                          <p className="text-xs text-muted-foreground mb-2">
                            Paste tx id (ALGO). We’ll confirm sender→receiver and amount on-chain.
                          </p>
                          <input
                            className="w-full input font-mono text-xs"
                            placeholder="TXID..."
                            value={txId[payment.id] || ""}
                            onChange={(e) =>
                              setTxId((prev) => ({ ...prev, [payment.id]: e.target.value }))
                            }
                          />
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              className="w-full input font-mono text-xs"
                              placeholder="Optional ASA ID (leave blank for ALGO)"
                              value={asaId[payment.id] || ""}
                              onChange={(e) =>
                                setAsaId((prev) => ({ ...prev, [payment.id]: e.target.value }))
                              }
                            />
                          </div>
                          <button
                            className="mt-2 w-full text-xs px-3 py-2 rounded gold-btn"
                            onClick={async () => {
                              const value = (txId[payment.id] || "").trim();
                              if (!value) {
                                toast.error("Enter a tx id first");
                                return;
                              }
                              try {
                                const assetRaw = (asaId[payment.id] || "").trim();
                                const assetId = assetRaw ? Number(assetRaw) : undefined;
                                if (assetRaw && (!Number.isFinite(assetId) || assetId <= 0)) {
                                  toast.error("Invalid ASA id");
                                  return;
                                }
                                await verifyAlgorandPayment(payment.id, value, { assetId });
                                toast.success("On-chain payment verified");
                                setVerifyingId(null);
                              } catch (e) {
                                const msg = e instanceof Error ? e.message : "Verification failed";
                                toast.error("Algorand verify failed", { description: msg });
                              }
                            }}
                          >
                            Verify on-chain
                          </button>
                          <div className="mt-3 flex justify-center opacity-80">
                            <LottiePlayer variant="loading" className="w-12 h-12" />
                          </div>
                        </div>
                      )}

                      {/* QR panel (inside card, no overflow) */}
                      {payment && isQrOpen && qrUrl && (
                        <div className="mt-3 premium-card p-3 w-full gold-border rounded-xl flex flex-col items-center">
                          <img src={qrUrl} alt="UPI QR code" className="w-32 h-32 rounded" />
                          <p className="mt-2 text-[10px] text-muted-foreground text-center">Scan to pay</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </PremiumCard>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default Payments;