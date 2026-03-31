import DashboardLayout from "@/components/DashboardLayout";
import { useAppData } from "@/lib/appData";
import { formatCurrency } from "@/lib/currency";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PaymentButton from "@/components/PaymentButton";
import { toast } from "sonner";

const BillDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { bills, payments, getUserById, updatePaymentStatus } = useAppData();

  const bill = bills.find((b) => b.id === id);

  if (!bill) {
    return (
      <DashboardLayout>
        <div className="glass-card p-6">
          <p className="text-sm text-muted-foreground">Bill not found.</p>
          <Link to="/dashboard" className="inline-flex mt-3 text-primary text-sm hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const billPayments = payments.filter((p) => p.billId === bill.id);
  const paidCount = 1 + billPayments.filter((p) => p.status === "completed").length;
  const totalCount = bill.participants.length;
  const progress = totalCount > 0 ? Math.min(100, (paidCount / totalCount) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link to="/dashboard" className="text-sm text-primary/70 hover:text-primary inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
        <h1 className="text-2xl font-display gold-text mt-2">{bill.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">{bill.category}</p>
      </div>

      <div className="glass-card p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <p className="text-sm text-muted-foreground">
            Total: <span className="text-primary font-semibold">{formatCurrency(bill.totalAmount, bill.currency)}</span>
          </p>
          <p className="text-sm text-primary/70">{paidCount}/{totalCount} paid</p>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="glass-card p-5">
        <h2 className="font-display gold-text text-lg mb-4">Participants</h2>
        <div className="space-y-3">
          {bill.participants.map((participant) => {
            const user = getUserById(participant.userId);
            const isPayer = participant.userId === bill.paidBy;
            const payment = billPayments.find((p) => p.fromUser === participant.userId);
            const isPaid = isPayer || payment?.status === "completed";
            return (
              <div key={participant.userId} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">{user?.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(participant.amount, bill.currency)}</p>
                </div>
                {isPayer ? (
                  <span className="status-paid">Paid</span>
                ) : (
                  <PaymentButton
                    upiId={user?.upiId}
                    recipientName={user?.name || "Member"}
                    amount={participant.amount}
                    currency={bill.currency}
                    status={isPaid ? "completed" : "pending"}
                    onMarkPaid={async () => {
                      if (!payment) return;
                      await updatePaymentStatus(payment.id, "completed");
                      toast.success("Payment marked as paid");
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BillDetails;
