/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useMemo } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Expense, Settlement, AppUser, Group, SettlementStatus, Bill, Payment } from "./types";
import { CurrencyCode, convertCurrency } from "./currency";
import { calculateBalances, simplifyDebts, SettlementTransaction } from "./balanceCalculator";
import { useAuth } from "@/contexts/AuthContext";

// ─── Mock Users ───
const MOCK_USERS: AppUser[] = [
  { id: "u1", name: "You (John)", email: "john@equora.io", upiId: "john@upi", algoAddress: "", preferredCurrency: "USD" },
  { id: "u2", name: "Arjun", email: "arjun@equora.io", upiId: "arjun@upi", algoAddress: "", preferredCurrency: "INR" },
  { id: "u3", name: "Priya", email: "priya@equora.io", upiId: "priya@upi", algoAddress: "", preferredCurrency: "INR" },
  { id: "u4", name: "Rahul", email: "rahul@equora.io", upiId: "rahul@upi", algoAddress: "", preferredCurrency: "EUR" },
  { id: "u5", name: "Sneha", email: "sneha@equora.io", upiId: "sneha@upi", algoAddress: "", preferredCurrency: "GBP" },
];

// ─── Mock Expenses ───
const MOCK_EXPENSES: Expense[] = [
  {
    id: "e1", title: "Dinner Night 🍕", category: "🍕 Food",
    amount: 1250, currency: "INR",
    convertedAmount: 15, exchangeRate: 0.012,
    paidBy: "u1",
    splitBetween: [
      { userId: "u1", amount: 250 }, { userId: "u2", amount: 250 },
      { userId: "u3", amount: 250 }, { userId: "u4", amount: 250 }, { userId: "u5", amount: 250 },
    ],
    groupId: "g1", createdAt: "2026-03-28T14:32:00Z",
  },
  {
    id: "e2", title: "Road Trip Fuel ⛽", category: "✈️ Travel",
    amount: 3800, currency: "INR",
    convertedAmount: 45.6, exchangeRate: 0.012,
    paidBy: "u2",
    splitBetween: [
      { userId: "u1", amount: 950 }, { userId: "u2", amount: 950 },
      { userId: "u3", amount: 950 }, { userId: "u4", amount: 950 },
    ],
    groupId: "g2", createdAt: "2026-03-25T09:15:00Z",
  },
  {
    id: "e3", title: "Grocery Split 🛒", category: "🛒 Shopping",
    amount: 45, currency: "USD",
    convertedAmount: 45, exchangeRate: 1,
    paidBy: "u3",
    splitBetween: [
      { userId: "u1", amount: 15 }, { userId: "u2", amount: 15 }, { userId: "u3", amount: 15 },
    ],
    groupId: "g1", createdAt: "2026-03-22T18:45:00Z",
  },
  {
    id: "e4", title: "Monthly Rent 🏠", category: "🏠 Rent",
    amount: 600, currency: "EUR",
    convertedAmount: 654, exchangeRate: 1.09,
    paidBy: "u4",
    splitBetween: [
      { userId: "u1", amount: 150 }, { userId: "u2", amount: 150 },
      { userId: "u4", amount: 150 }, { userId: "u5", amount: 150 },
    ],
    groupId: "g3", createdAt: "2026-03-20T11:00:00Z",
  },
  {
    id: "e5", title: "Office Lunch 🍱", category: "🍕 Food",
    amount: 200, currency: "GBP",
    convertedAmount: 254, exchangeRate: 1.27,
    paidBy: "u5",
    splitBetween: [
      { userId: "u1", amount: 50 }, { userId: "u3", amount: 50 },
      { userId: "u5", amount: 50 }, { userId: "u2", amount: 50 },
    ],
    groupId: "g4", createdAt: "2026-03-18T16:22:00Z",
  },
];

const MOCK_GROUPS: Group[] = [
  { id: "g1", name: "Weekend Squad", emoji: "🎉", memberIds: ["u1", "u2", "u3", "u4", "u5"], createdAt: "2026-01-15T00:00:00Z" },
  { id: "g2", name: "Goa Trip", emoji: "✈️", memberIds: ["u1", "u2", "u3", "u4"], createdAt: "2026-02-01T00:00:00Z" },
  { id: "g3", name: "Hostel Roommates", emoji: "🏠", memberIds: ["u1", "u2", "u4", "u5"], createdAt: "2026-01-10T00:00:00Z" },
  { id: "g4", name: "Office Lunch", emoji: "🍱", memberIds: ["u1", "u2", "u3", "u5"], createdAt: "2026-03-01T00:00:00Z" },
];

// ─── Context ───
interface AppDataContextType {
  users: AppUser[];
  currentUser: AppUser;
  expenses: Expense[];
  bills: Bill[];
  payments: Payment[];
  settlements: Settlement[];
  groups: Group[];
  addGroup: (group: Omit<Group, "id" | "createdAt">) => Promise<void>;
  addBill: (bill: Omit<Bill, "id" | "createdAt">) => Promise<string>;
  addExpense: (expense: Omit<Expense, "id" | "createdAt" | "convertedAmount" | "exchangeRate"> & { billId?: string }) => Promise<void>;
  addPayment: (payment: Omit<Payment, "id" | "createdAt" | "completedAt">) => Promise<void>;
  updatePaymentStatus: (id: string, status: Payment["status"]) => Promise<void>;
  verifyAlgorandPayment: (paymentId: string, txId: string, opts?: { assetId?: number }) => Promise<void>;
  addSettlement: (settlement: Omit<Settlement, "id" | "createdAt">) => Promise<void>;
  updateSettlementStatus: (id: string, status: SettlementStatus) => Promise<void>;
  getUserById: (id: string) => AppUser | undefined;
  // 🧮 Balance calculation functions
  calculateBalances: (bills: Bill[], expenses: Expense[]) => Record<string, number>;
  simplifyDebts: (balances: Record<string, number>) => SettlementTransaction[];
}

const AppDataContext = createContext<AppDataContextType | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>(MOCK_USERS);
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);
  const cleanUndefined = <T extends Record<string, unknown>>(obj: T): T =>
    Object.fromEntries(
      Object.entries(obj).filter(([, value]) => value !== undefined)
    ) as T;
  const currentUser = useMemo<AppUser>(() => {
    const authEmail = authUser?.email?.toLowerCase();
    if (authEmail) {
      const matched = users.find((u) => u.email.toLowerCase() === authEmail);
      if (matched) return matched;
      return {
        id: authUser?.uid || "u1",
        name: authUser?.displayName || authUser?.email?.split("@")[0] || "You",
        email: authUser?.email || "you@equora.io",
        preferredCurrency: "USD",
      };
    }

    if (users.length > 0) return users[0];
    return {
      id: "u1",
      name: "You",
      email: "you@equora.io",
      preferredCurrency: "USD",
    };
  }, [users, authUser]);

  const getUserById = useCallback(
    (id: string) => {
      const existing = users.find((u) => u.id === id);
      if (existing) return existing;

      if (authUser?.uid === id) {
        return {
          id: authUser.uid,
          name: authUser.displayName || authUser.email?.split("@")[0] || "You",
          email: authUser.email || "you@equora.io",
          preferredCurrency: "USD",
        };
      }

      return {
        id,
        name: `Member ${id.slice(0, 4)}`,
        email: `${id}@equora.local`,
        upiId: `${id.slice(0, 4)}@upi`,
        preferredCurrency: "USD",
      };
    },
    [users, authUser]
  );

  useEffect(() => {
    if (!authUser?.email) return;
    const authEmail = authUser.email.toLowerCase();
    setUsers((prev) => {
      if (prev.some((u) => u.email.toLowerCase() === authEmail)) return prev;
      return [
        {
          id: authUser.uid,
          name: authUser.displayName || authUser.email.split("@")[0],
          email: authUser.email,
          preferredCurrency: "USD",
        },
        ...prev,
      ];
    });
  }, [authUser]);

  useEffect(() => {
    if (!db) return;
    const fallbackUserId = authUser?.uid || "u1";
    const asString = (value: unknown, fallback = ""): string =>
      typeof value === "string" ? value : fallback;
    const asNumber = (value: unknown, fallback = 0): number =>
      typeof value === "number" && Number.isFinite(value) ? value : fallback;
    const asArray = <T,>(value: unknown, fallback: T[] = []): T[] =>
      Array.isArray(value) ? (value as T[]) : fallback;
    const normalizeCreatedAt = (value: unknown): string => {
      if (!value) return new Date().toISOString();
      if (typeof value === "string") return value;
      if (value && typeof (value as { toDate?: () => Date }).toDate === "function") {
        return (value as { toDate: () => Date }).toDate().toISOString();
      }
      return new Date().toISOString();
    };
    const normalizeOptionalDate = (value: unknown): string | undefined => {
      if (!value) return undefined;
      if (typeof value === "string") return value;
      if (value && typeof (value as { toDate?: () => Date }).toDate === "function") {
        return (value as { toDate: () => Date }).toDate().toISOString();
      }
      return undefined;
    };

    const normalizeExpense = (id: string, data: Record<string, unknown>): Expense => ({
      id,
      title: asString(data.title, "Untitled Expense"),
      category: asString(data.category, "General"),
      amount: asNumber(data.amount, 0),
      currency: asString(data.currency, "USD") as CurrencyCode,
      convertedAmount: asNumber(data.convertedAmount, asNumber(data.amount, 0)),
      exchangeRate: asNumber(data.exchangeRate, 1),
      paidBy: asString(data.paidBy, fallbackUserId),
      splitBetween: asArray<{ userId: string; amount: number }>(data.splitBetween, []),
      groupId: typeof data.groupId === "string" ? data.groupId : undefined,
      description: typeof data.description === "string" ? data.description : undefined,
      createdAt: normalizeCreatedAt(data.createdAt),
    });

    const normalizeBill = (id: string, data: Record<string, unknown>): Bill => ({
      id,
      title: asString(data.title, "Untitled Bill"),
      category: asString(data.category, "General"),
      createdBy: asString(data.createdBy, fallbackUserId),
      paidBy: asString(data.paidBy, asString(data.createdBy, fallbackUserId)),
      groupId: typeof data.groupId === "string" ? data.groupId : undefined,
      description: typeof data.description === "string" ? data.description : undefined,
      totalAmount: asNumber(data.totalAmount, 0),
      currency: asString(data.currency, "USD") as CurrencyCode,
      splitType: (["equal", "custom", "percentage"].includes(asString(data.splitType))
        ? asString(data.splitType)
        : "equal") as Bill["splitType"],
      participants: asArray<{ userId: string; amount: number }>(data.participants, []),
      createdAt: normalizeCreatedAt(data.createdAt),
    });

    const getLocalAuthUser = (): AppUser[] => {
      if (!authUser?.email) return [];
      return [
        {
          id: authUser.uid,
          name: authUser.displayName || authUser.email.split("@")[0],
          email: authUser.email,
          preferredCurrency: "USD",
          algoAddress: "",
        },
      ];
    };

    const unsubUsers = onSnapshot(
      query(collection(db, "users"), orderBy("name")),
      (snap) => {
        const mergeUsers = (base: AppUser[]) =>
          base.filter(
            (u, index, arr) =>
              arr.findIndex(
                (x) =>
                  x.id === u.id || x.email.toLowerCase() === u.email.toLowerCase()
              ) === index
          );

        if (snap.empty) {
          const authUsers = getLocalAuthUser();
          setUsers(mergeUsers([...authUsers, ...MOCK_USERS]));
        } else {
          const remoteUsers = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          } as AppUser));
          const authUsers = getLocalAuthUser();
          setUsers(
            mergeUsers([...remoteUsers, ...authUsers, ...MOCK_USERS])
          );
        }
      },
      (error) => {
        console.error("Failed to listen to users collection:", error);
        const authUsers = getLocalAuthUser();
        setUsers(
          [...authUsers, ...MOCK_USERS].filter(
            (u, index, arr) =>
              arr.findIndex(
                (x) =>
                  x.id === u.id || x.email.toLowerCase() === u.email.toLowerCase()
              ) === index
          )
        );
      }
    );

    const unsubGroups = onSnapshot(
      query(collection(db, "groups"), orderBy("name")),
      (snap) => {
        if (snap.empty) {
          setGroups(MOCK_GROUPS);
        } else {
          setGroups(
            snap.docs.map((d) => {
              const data = d.data() as Record<string, unknown>;
              return {
                id: d.id,
                ...data,
                createdAt: normalizeCreatedAt(data.createdAt),
              } as Group;
            })
          );
        }
      },
      (error) => {
        console.error("Failed to listen to groups collection:", error);
        setGroups(MOCK_GROUPS);
      }
    );

    const unsubExpenses = onSnapshot(
      query(collection(db, "expenses"), orderBy("createdAt", "desc")),
      (snap) => {
        if (snap.empty) {
          setExpenses(MOCK_EXPENSES);
        } else {
          setExpenses(
            snap.docs.map((d) => {
              const data = d.data() as Record<string, unknown>;
              return normalizeExpense(d.id, data);
            })
          );
        }
      },
      (error) => {
        console.error("Failed to listen to expenses collection:", error);
        setExpenses(MOCK_EXPENSES);
      }
    );

    const unsubBills = onSnapshot(
      query(collection(db, "bills"), orderBy("createdAt", "desc")),
      (snap) => {
        setBills(
          snap.docs.map((d) => {
            const data = d.data() as Record<string, unknown>;
            return normalizeBill(d.id, data);
          })
        );
      },
      (error) => {
        console.error("Failed to listen to bills collection:", error);
        setBills([]);
      }
    );

    const unsubPayments = onSnapshot(
      query(collection(db, "payments"), orderBy("createdAt", "desc")),
      (snap) => {
        setPayments(
          snap.docs.map((d) => {
            const data = d.data() as Record<string, unknown>;
            return {
              id: d.id,
              ...data,
              createdAt: normalizeCreatedAt(data.createdAt),
              completedAt: normalizeOptionalDate(data.completedAt),
            } as Payment;
          })
        );
      },
      (error) => {
        console.error("Failed to listen to payments collection:", error);
        setPayments([]);
      }
    );

    const unsubSettlements = onSnapshot(
      query(collection(db, "settlements"), orderBy("createdAt", "desc")),
      (snap) => {
        setSettlements(
          snap.docs.map((d) => {
            const data = d.data() as Record<string, unknown>;
            return {
              id: d.id,
              ...data,
              createdAt: normalizeCreatedAt(data.createdAt),
              completedAt: normalizeOptionalDate(data.completedAt),
            } as Settlement;
          })
        );
      },
      (error) => {
        console.error("Failed to listen to settlements collection:", error);
        setSettlements([]);
      }
    );

    return () => {
      unsubUsers();
      unsubGroups();
      unsubExpenses();
      unsubBills();
      unsubPayments();
      unsubSettlements();
    };
  }, [authUser]);

  const addGroup = useCallback(async (group: Omit<Group, "id" | "createdAt">) => {
    const data: Omit<Group, "id"> = {
      ...group,
      createdAt: new Date().toISOString(),
    };
    if (!db) {
      setGroups((prev) => [{ ...data, id: `g${Date.now()}` }, ...prev]);
      return;
    }
    const created = await addDoc(collection(db, "groups"), cleanUndefined(data));
    setGroups((prev) => [{ ...data, id: created.id }, ...prev]);
  }, []);

  const addBill = useCallback(async (bill: Omit<Bill, "id" | "createdAt">) => {
    const data: Omit<Bill, "id"> = {
      ...bill,
      createdAt: new Date().toISOString(),
    };
    if (!db) {
      const id = `b${Date.now()}`;
      setBills((prev) => [{ ...data, id }, ...prev]);
      return id;
    }
    const created = await addDoc(collection(db, "bills"), cleanUndefined(data));
    setBills((prev) => [{ ...data, id: created.id }, ...prev]);
    return created.id;
  }, []);

  const addExpense = useCallback(async (exp: Omit<Expense, "id" | "createdAt" | "convertedAmount" | "exchangeRate"> & { billId?: string }) => {
    const rate = exp.currency === "USD" ? 1 : convertCurrency(1, exp.currency, "USD");
    const recordId = exp.billId || `e${Date.now()}`;
    const newExp: Expense = {
      ...exp,
      id: recordId,
      convertedAmount: exp.amount * rate,
      exchangeRate: rate,
      createdAt: new Date().toISOString(),
    };

    if (db) {
      await addDoc(collection(db, "expenses"), cleanUndefined(newExp));
    }
    setExpenses((prev) => [newExp, ...prev]);

    // Create payment records for each participant excluding payer.
    const creditUser = exp.paidBy;
    if (db) {
      const paymentPromises = exp.splitBetween
        .filter((split) => split.userId !== creditUser && split.amount > 0)
        .map((split) => {
          const paymentData: Omit<Payment, "id" | "createdAt" | "completedAt"> = {
            billId: recordId,
            fromUser: split.userId,
            toUser: creditUser,
            amount: split.amount,
            currency: exp.currency,
            status: "pending",
          };
          return addDoc(collection(db, "payments"), cleanUndefined({
            ...paymentData,
            createdAt: new Date().toISOString(),
          }));
        });
      await Promise.all(paymentPromises);
    } else {
      const localPayments: Payment[] = exp.splitBetween
        .filter((split) => split.userId !== creditUser && split.amount > 0)
        .map((split) => ({
          id: `p${Date.now()}-${split.userId}`,
          billId: recordId,
          fromUser: split.userId,
          toUser: creditUser,
          amount: split.amount,
          currency: exp.currency,
          status: "pending",
          createdAt: new Date().toISOString(),
        }));
      setPayments((prev) => [...localPayments, ...prev]);
    }
  }, []);

  const addPayment = useCallback(async (payment: Omit<Payment, "id" | "createdAt" | "completedAt">) => {
    const data = {
      ...payment,
      createdAt: new Date().toISOString(),
      status: payment.status || "pending",
    };
    if (!db) {
      setPayments((prev) => [{ ...data, id: `p${Date.now()}` }, ...prev]);
      return;
    }
    const created = await addDoc(collection(db, "payments"), cleanUndefined(data));
    setPayments((prev) => [{ ...data, id: created.id }, ...prev]);
  }, []);

  const updatePaymentStatus = useCallback(async (id: string, status: Payment["status"]) => {
    if (!db) {
      const completedAt = status === "completed" ? new Date().toISOString() : undefined;
      setPayments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status, completedAt } : p))
      );
      return;
    }
    const paymentRef = doc(db, "payments", id);
    const completedAt = status === "completed" ? new Date().toISOString() : null;
    await updateDoc(paymentRef, {
      status,
      completedAt,
    });
    setPayments((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status, completedAt: completedAt ?? undefined } : p
      )
    );
  }, []);

  const verifyAlgorandPayment = useCallback(
    async (paymentId: string, txId: string, opts?: { assetId?: number }) => {
      if (!db) throw new Error("Database not configured");
      const payment = payments.find((p) => p.id === paymentId);
      if (!payment) throw new Error("Payment not found");

      const sender = getUserById(payment.fromUser)?.algoAddress;
      const receiver = getUserById(payment.toUser)?.algoAddress;
      if (!sender || !receiver) throw new Error("Missing Algorand addresses for sender/receiver");

      const { fetchTransactionById, verifyAlgoPaymentTx, verifyAsaTransferTx, ensureOptedIn } = await import("./algorand");
      const tx = await fetchTransactionById(txId);

      const assetId = opts?.assetId;
      const verdict = assetId
        ? (await (async () => {
            await ensureOptedIn(receiver, assetId);
            return verifyAsaTransferTx({
              tx,
              expectedSender: sender,
              expectedReceiver: receiver,
              expectedAssetId: assetId,
              expectedAmount: Math.round(payment.amount),
            });
          })())
        : (() => {
            // Interpret "amount" as ALGO for on-chain verification.
            const expectedMicroAlgos = Math.round(payment.amount * 1_000_000);
            return verifyAlgoPaymentTx({
              tx,
              expectedSender: sender,
              expectedReceiver: receiver,
              expectedMicroAlgos,
            });
          })();
      if (!verdict.ok) throw new Error(verdict.reason || "Transaction did not match expected payment");

      const paymentRef = doc(db, "payments", paymentId);
      const completedAt = new Date().toISOString();
      await updateDoc(paymentRef, cleanUndefined({
        status: "completed",
        completedAt,
        chain: "algorand",
        proofTxId: txId,
        assetId: assetId ?? undefined,
      }));

      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? { ...p, status: "completed", completedAt, chain: "algorand", proofTxId: txId, assetId } : p))
      );
    },
    [payments, getUserById]
  );

  const addSettlement = useCallback(async (s: Omit<Settlement, "id" | "createdAt">) => {
    const newS: Omit<Settlement, "id"> = {
      ...s,
      createdAt: new Date().toISOString(),
    };
    if (!db) {
      setSettlements((prev) => [{ ...newS, id: `s${Date.now()}` }, ...prev]);
      return;
    }
    const created = await addDoc(collection(db, "settlements"), cleanUndefined(newS));
    setSettlements((prev) => [{ ...newS, id: created.id }, ...prev]);
  }, []);

  const updateSettlementStatus = useCallback(async (id: string, status: SettlementStatus) => {
    if (!db) {
      setSettlements((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status, completedAt: status === "completed" ? new Date().toISOString() : undefined } : s
        )
      );
      return;
    }
    const settlementRef = doc(db, "settlements", id);
    await updateDoc(settlementRef, {
      status,
      completedAt: status === "completed" ? new Date().toISOString() : null,
    });
    setSettlements((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status, completedAt: status === "completed" ? new Date().toISOString() : undefined } : s
      )
    );
  }, []);

  return (
    <AppDataContext.Provider value={{ users, currentUser, expenses, bills, payments, settlements, groups, addGroup, addBill, addExpense, addPayment, updatePaymentStatus, verifyAlgorandPayment, addSettlement, updateSettlementStatus, getUserById, calculateBalances, simplifyDebts }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}

// Standalone export for addBill (can be used outside hook if needed)
export async function addBill(bill: Omit<Bill, "id" | "createdAt">) {
  const data: Omit<Bill, "id"> = {
    ...bill,
    createdAt: new Date().toISOString(),
  };
  if (!db) {
    return { id: `b${Date.now()}` };
  }
  return await addDoc(collection(db, "bills"), data);
}
