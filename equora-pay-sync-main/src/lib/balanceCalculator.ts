/**
 * 🧮 Balance Calculator & Settlement Optimizer
 * This is the CORE BRAIN of Equora
 * - Calculates who owes whom
 * - Optimizes settlements to minimal transactions
 */

import { Bill, Expense, Payment, Settlement } from "./types";

// ─── Step 5: Calculate Balances ───
/**
 * Calculate net balance for each user
 * +ve → user should RECEIVE 💰
 * -ve → user OWES 💸
 */
export function calculateBalances(
  bills: Bill[],
  expenses: Expense[]
): Record<string, number> {
  const balances: Record<string, number> = {};

  // Process bills
  bills.forEach((bill) => {
    // Initialize user if not exists
    if (!balances[bill.paidBy]) balances[bill.paidBy] = 0;

    bill.participants.forEach((p) => {
      if (!balances[p.userId]) balances[p.userId] = 0;

      if (p.userId === bill.paidBy) {
        // Payer receives back the share they owe themselves
        balances[bill.paidBy] += bill.totalAmount - p.amount;
      } else {
        // Non-payer owes their share
        balances[p.userId] -= p.amount;
      }
    });
  });

  // Process expenses (for backward compatibility)
  expenses.forEach((exp) => {
    if (!balances[exp.paidBy]) balances[exp.paidBy] = 0;

    exp.splitBetween.forEach((split) => {
      if (!balances[split.userId]) balances[split.userId] = 0;

      if (split.userId === exp.paidBy) {
        balances[exp.paidBy] += exp.amount - split.amount;
      } else {
        balances[split.userId] -= split.amount;
      }
    });
  });

  return balances;
}

// ─── Step 7: Smart Settlement Logic (WINNER MOVE) ───
/**
 * Simplify debts using greedy algorithm
 * Input: balances ({user: net amount})
 * Output: minimal transactions
 *
 * Example:
 * Before: A owes B 500, B owes C 300, C owes A 200
 * After: A pays C 200, B pays C 200 🔥
 */
export interface SettlementTransaction {
  from: string; // userId (debtor)
  to: string;   // userId (creditor)
  amount: number;
}

export function simplifyDebts(balances: Record<string, number>): SettlementTransaction[] {
  const debtors: { user: string; amount: number }[] = [];
  const creditors: { user: string; amount: number }[] = [];

  // Separate debtors and creditors
  for (const [user, balance] of Object.entries(balances)) {
    if (balance < -0.01) {
      // Negative balance = owes money
      debtors.push({ user, amount: -balance });
    } else if (balance > 0.01) {
      // Positive balance = should receive money
      creditors.push({ user, amount: balance });
    }
  }

  const transactions: SettlementTransaction[] = [];

  // Greedy matching: match debtors with creditors
  let i = 0; // pointer to debtors
  let j = 0; // pointer to creditors

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    // Match minimum of debtor amount and creditor amount
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0.01) {
      transactions.push({
        from: debtor.user,
        to: creditor.user,
        amount: Math.round(amount * 100) / 100, // round to 2 decimals
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    // Move pointers
    if (Math.abs(debtor.amount) < 0.01) i++;
    if (Math.abs(creditor.amount) < 0.01) j++;
  }

  return transactions.sort((a, b) => b.amount - a.amount); // sort by amount descending
}

// ─── Helper: Get owes relationships ───
/**
 * Get detailed "who owes whom" with user info
 */
export interface OwesRelationship {
  from: string; // debtor userId
  to: string;   // creditor userId
  amount: number;
}

export function getOwesRelationships(balances: Record<string, number>): OwesRelationship[] {
  const transactions = simplifyDebts(balances);
  return transactions.map((t) => ({
    from: t.from,
    to: t.to,
    amount: t.amount,
  }));
}

// ─── Round currency values ───
export function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}
