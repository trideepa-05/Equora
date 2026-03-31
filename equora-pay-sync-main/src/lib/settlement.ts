import { convertCurrency, CurrencyCode } from "./currency";
import { Expense, Settlement, AppUser } from "./types";

/**
 * Calculate net balances for each user from a list of expenses.
 * Positive = owed money (creditor), Negative = owes money (debtor).
 * All amounts converted to the target currency.
 */
export function calculateBalances(
  expenses: Expense[],
  targetCurrency: CurrencyCode
): Record<string, number> {
  const balances: Record<string, number> = {};

  for (const exp of expenses) {
    const totalInTarget = convertCurrency(exp.amount, exp.currency, targetCurrency);
    // Payer gets credit
    balances[exp.paidBy] = (balances[exp.paidBy] || 0) + totalInTarget;

    // Each split member gets debited
    for (const split of exp.splitBetween) {
      const shareInTarget = convertCurrency(split.amount, exp.currency, targetCurrency);
      balances[split.userId] = (balances[split.userId] || 0) - shareInTarget;
    }
  }

  return balances;
}

/**
 * Greedy algorithm to minimize the number of transactions needed to settle debts.
 * Returns a list of settlement suggestions.
 */
export function calculateSettlements(
  expenses: Expense[],
  targetCurrency: CurrencyCode,
  existingSettlements: Settlement[] = []
): { fromUser: string; toUser: string; amount: number }[] {
  const balances = calculateBalances(expenses, targetCurrency);

  // Subtract completed settlements
  for (const s of existingSettlements) {
    if (s.status === "completed") {
      const amt = convertCurrency(s.amount, s.currency, targetCurrency);
      balances[s.fromUser] = (balances[s.fromUser] || 0) + amt;
      balances[s.toUser] = (balances[s.toUser] || 0) - amt;
    }
  }

  // Split into creditors (positive balance) and debtors (negative balance)
  const creditors: { userId: string; amount: number }[] = [];
  const debtors: { userId: string; amount: number }[] = [];

  for (const [userId, balance] of Object.entries(balances)) {
    const rounded = Math.round(balance * 100) / 100;
    if (rounded > 0.01) creditors.push({ userId, amount: rounded });
    else if (rounded < -0.01) debtors.push({ userId, amount: Math.abs(rounded) });
  }

  // Sort descending
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: { fromUser: string; toUser: string; amount: number }[] = [];

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const transfer = Math.min(debtors[i].amount, creditors[j].amount);
    if (transfer > 0.01) {
      settlements.push({
        fromUser: debtors[i].userId,
        toUser: creditors[j].userId,
        amount: Math.round(transfer * 100) / 100,
      });
    }
    debtors[i].amount -= transfer;
    creditors[j].amount -= transfer;

    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return settlements;
}

/**
 * Get who owes whom breakdown for display.
 */
export function getOwesRelationships(
  expenses: Expense[],
  users: AppUser[],
  targetCurrency: CurrencyCode
): { from: AppUser; to: AppUser; amount: number }[] {
  const suggestions = calculateSettlements(expenses, targetCurrency);
  const userMap = new Map(users.map((u) => [u.id, u]));

  return suggestions
    .map((s) => ({
      from: userMap.get(s.fromUser)!,
      to: userMap.get(s.toUser)!,
      amount: s.amount,
    }))
    .filter((r) => r.from && r.to);
}
