import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  CURRENCIES,
  CurrencyCode,
  useCurrency,
  formatCurrency,
} from "@/lib/currency";

import { Bill } from "@/lib/types";
import { useAppData } from "@/lib/appData";

const categories = [
  "🍕 Food",
  "✈️ Travel",
  "🏠 Rent",
  "🛒 Shopping",
  "💡 Utilities",
  "🎉 Entertainment",
];

const CreateBill = () => {
  const navigate = useNavigate();
  const { baseCurrency } = useCurrency();
  const { users, currentUser, addExpense, addBill } = useAppData();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [category, setCategory] = useState(categories[0]);

  const [splitType, setSplitType] = useState<
    "equal" | "percentage" | "custom"
  >("equal");

  const [selectedUsers, setSelectedUsers] = useState<string[]>([
    currentUser.id,
  ]);

  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [percentageSplits, setPercentageSplits] = useState<
    Record<string, string>
  >({});

  const total = parseFloat(amount) || 0;
  const participantCount = selectedUsers.length || 1;
  const perPerson = total / participantCount;

  const totalPercent = selectedUsers.reduce((sum, uid) => {
    const v = parseFloat(percentageSplits[uid] || "0");
    return sum + (isNaN(v) ? 0 : v);
  }, 0);

  const customSum = selectedUsers.reduce((sum, uid) => {
    const v = parseFloat(customSplits[uid] || "0");
    return sum + (isNaN(v) ? 0 : v);
  }, 0);

  const splitBetween = selectedUsers.map((uid) => {
    if (splitType === "percentage") {
      const pct = parseFloat(
        percentageSplits[uid] || String(100 / participantCount)
      );
      const amt = (pct / 100) * total;
      return { userId: uid, amount: Math.round(amt * 100) / 100 };
    }

    if (splitType === "custom") {
      const amt = parseFloat(customSplits[uid] || "0");
      return {
        userId: uid,
        amount: isNaN(amt) ? 0 : Math.round(amt * 100) / 100,
      };
    }

    return {
      userId: uid,
      amount: Math.round(perPerson * 100) / 100,
    };
  });

  const toggleUser = (id: string) => {
    if (id === currentUser.id) return;

    setSelectedUsers((prev) =>
      prev.includes(id)
        ? prev.filter((u) => u !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    const normalizedTitle = title.trim();
    const parsedAmount = parseFloat(amount);

    if (!normalizedTitle) {
      toast.error("Please enter a bill title");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    if (selectedUsers.length < 2) {
      toast.error("Select at least 2 participants");
      return;
    }

    if (splitType === "percentage" && Math.round(totalPercent) !== 100) {
      toast.error("Percentages must total 100%");
      return;
    }

    if (
      splitType === "custom" &&
      Math.round(customSum * 100) / 100 !==
        Math.round(total * 100) / 100
    ) {
      toast.error("Custom amounts must equal total bill amount");
      return;
    }

    const bill: Omit<Bill, "id" | "createdAt"> = {
      title,
      description,
      category,
      createdBy: currentUser.id,
      paidBy: currentUser.id,
      groupId: undefined,
      totalAmount: parsedAmount,
      currency: currency as CurrencyCode,
      splitType,
      participants: splitBetween,
    };

    try {
      const createdBillId = await addBill(bill);

      await addExpense({
        title: normalizedTitle,
        description,
        category,
        amount: parsedAmount,
        currency: currency as CurrencyCode,
        paidBy: currentUser.id,
        splitBetween,
        billId: createdBillId,
      });

      toast.success("Bill created!", {
        description: `${formatCurrency(
          parsedAmount,
          currency as CurrencyCode
        )} split between ${selectedUsers.length} people`,
      });

      navigate("/payments");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create bill";
      toast.error("Could not create bill", { description: message });
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display gold-text">
          Create Bill
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Split expenses with your group
        </p>
      </div>

      <div className="space-y-6">
        {/* BASIC DETAILS */}
        <div className="glass-card p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Bill Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Goa Trip Dinner"
              className="w-full input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Amount</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 1998"
              type="number"
              min="0"
              step="0.01"
              className="w-full input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Currency</label>
            <select
              value={currency}
              onChange={(e) =>
                setCurrency(e.target.value as CurrencyCode)
              }
              className="w-full input"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>

          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            className="w-full input"
          />
        </div>

        {/* USERS */}
        <div className="glass-card p-5">
          <h2 className="flex items-center gap-2 mb-3">
            <Users /> Split Between
          </h2>

          {users.map((user) => {
            const selected = selectedUsers.includes(user.id);

            return (
              <button
                key={user.id}
                onClick={() => toggleUser(user.id)}
                className={`p-2 rounded border ${
                  selected ? "bg-primary/20" : ""
                }`}
              >
                {user.name}
              </button>
            );
          })}
        </div>

        {/* SUBMIT */}
        <button
          onClick={handleSubmit}
          className="w-full gold-btn"
        >
          Create Bill
        </button>
      </div>
    </DashboardLayout>
  );
};

export default CreateBill;