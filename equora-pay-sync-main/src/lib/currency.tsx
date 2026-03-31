/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, ReactNode } from "react";

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP";

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
];

// Mock exchange rates (to USD as intermediate)
const TO_USD: Record<CurrencyCode, number> = {
  USD: 1,
  INR: 0.012,
  EUR: 1.09,
  GBP: 1.27,
};

export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  if (from === to) return amount;
  const usd = amount * TO_USD[from];
  return usd / TO_USD[to];
}

export function formatCurrency(amount: number, code: CurrencyCode): string {
  const info = CURRENCIES.find((c) => c.code === code)!;
  return `${info.symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function getCurrencySymbol(code: CurrencyCode): string {
  return CURRENCIES.find((c) => c.code === code)!.symbol;
}

export function conversionPreview(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): string {
  if (from === to || amount <= 0) return "";
  const converted = convertCurrency(amount, from, to);
  return `${formatCurrency(amount, from)} ≈ ${formatCurrency(converted, to)}`;
}

// Context for global base currency preference
interface CurrencyContextType {
  baseCurrency: CurrencyCode;
  setBaseCurrency: (c: CurrencyCode) => void;
}

const CurrencyContext = createContext<CurrencyContextType>({
  baseCurrency: "USD",
  setBaseCurrency: () => {},
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>(
    () => (localStorage.getItem("equora-base-currency") as CurrencyCode) || "USD"
  );

  const handleSet = (c: CurrencyCode) => {
    setBaseCurrency(c);
    localStorage.setItem("equora-base-currency", c);
  };

  return (
    <CurrencyContext.Provider value={{ baseCurrency, setBaseCurrency: handleSet }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
