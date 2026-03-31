import { CurrencyCode } from "./currency";

// ─── User ───
export interface AppUser {
  id: string;
  name: string;
  email: string;
  upiId?: string;
  algoAddress?: string;
  avatar?: string;
  preferredCurrency: CurrencyCode;
  region?: string;
}

// ─── Expense ───
export interface ExpenseSplit {
  userId: string;
  amount: number; // in original currency
}

export interface Expense {
  id: string;
  title: string;
  description?: string;
  category: string;
  amount: number;
  currency: CurrencyCode;
  convertedAmount: number; // in base currency (USD)
  exchangeRate: number;
  paidBy: string; // userId
  splitBetween: ExpenseSplit[];
  groupId?: string;
  createdAt: string;
}

// ─── Settlement ───
export type SettlementStatus = "pending" | "completed";

export interface Settlement {
  id: string;
  fromUser: string; // userId
  toUser: string;   // userId
  amount: number;
  currency: CurrencyCode;
  status: SettlementStatus;
  expenseIds: string[];
  createdAt: string;
  completedAt?: string;
}

// ─── Bill ───
export interface Bill {
  id: string;
  title: string;
  description?: string;
  category: string;
  createdBy: string; // userId
  paidBy: string; // 🔥 who paid the bill (core for balance calc)
  groupId?: string;
  totalAmount: number;
  currency: CurrencyCode;
  splitType: "equal" | "custom" | "percentage";
  participants: ExpenseSplit[];
  createdAt: string;
}

// ─── Payment ───
export type PaymentStatus = "pending" | "completed";
export interface Payment {
  id: string;
  billId: string;
  fromUser: string;
  toUser: string;
  amount: number;
  currency: CurrencyCode;
  status: PaymentStatus;
  createdAt: string;
  completedAt?: string;
  chain?: "upi" | "algorand";
  proofTxId?: string;
  assetId?: number; // ASA id if paid with ASA, undefined => ALGO
}

// ─── Group ───
export interface Group {
  id: string;
  name: string;
  emoji: string;
  memberIds: string[];
  createdAt: string;
}
