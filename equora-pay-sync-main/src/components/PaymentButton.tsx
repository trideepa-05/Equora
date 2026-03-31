import { useMemo, useState } from "react";
import { CurrencyCode, formatCurrency } from "@/lib/currency";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { generateUpiLink } from "@/lib/upi";

interface PaymentButtonProps {
  upiId?: string;
  recipientName: string;
  amount: number;
  currency: CurrencyCode;
  status: "pending" | "completed";
  onMarkPaid: () => Promise<void> | void;
  payButtonClassName?: string;
  markPaidButtonClassName?: string;
  heightClassName?: string;
}

const PaymentButton = ({
  upiId,
  recipientName,
  amount,
  currency,
  status,
  onMarkPaid,
  payButtonClassName = "",
  markPaidButtonClassName = "",
  heightClassName = "h-10",
}: PaymentButtonProps) => {
  const [upiOpened, setUpiOpened] = useState(false);
  const normalizedUpiId = useMemo(
    () => (upiId && upiId.includes("@") ? upiId : ""),
    [upiId]
  );

  if (status === "completed") {
    return (
      <button
        disabled
        className={`text-xs px-3 rounded border border-primary/40 bg-primary/15 text-primary cursor-not-allowed ${heightClassName}`}
      >
        Paid ✅
      </button>
    );
  }

  if (upiOpened) {
    return (
      <div className="flex items-center gap-2">
        <AnimatedButton
          onClick={() => void onMarkPaid()}
          className={`text-xs px-3 rounded border border-primary/40 text-primary hover:bg-primary/10 transition-colors shimmer ${heightClassName} ${markPaidButtonClassName}`}
        >
          Mark as Paid ({formatCurrency(amount, currency)})
        </AnimatedButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <AnimatedButton
        onClick={() => {
          if (!normalizedUpiId) return;
          window.location.href = generateUpiLink(normalizedUpiId, recipientName, amount);
          setUpiOpened(true);
        }}
        disabled={!normalizedUpiId}
        className={`text-xs px-3 rounded border border-primary/40 text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${heightClassName} ${payButtonClassName}`}
        title={
          normalizedUpiId
            ? `Pay ${formatCurrency(amount, currency)} via UPI`
            : "UPI ID missing"
        }
      >
        Pay via UPI
      </AnimatedButton>
    </div>
  );
};

export default PaymentButton;