export type AlgoNetwork = "mainnet" | "testnet";

const DEFAULT_INDEXERS: Record<AlgoNetwork, string> = {
  // Public Nodely indexers (no API key required)
  mainnet: "https://mainnet-idx.4160.nodely.dev",
  testnet: "https://testnet-idx.4160.nodely.dev",
};

export function getAlgoNetwork(): AlgoNetwork {
  const raw = (import.meta.env.VITE_ALGO_NETWORK || "testnet").toLowerCase();
  return raw === "mainnet" ? "mainnet" : "testnet";
}

export function getIndexerBase(): string {
  const override = import.meta.env.VITE_ALGO_INDEXER_BASE;
  if (override && typeof override === "string") return override.replace(/\/$/, "");
  return DEFAULT_INDEXERS[getAlgoNetwork()];
}

export type IndexerTxResponse = {
  transaction?: {
    id?: string;
    "confirmed-round"?: number;
    sender?: string;
    "payment-transaction"?: { receiver?: string; amount?: number };
    "asset-transfer-transaction"?: {
      receiver?: string;
      amount?: number;
      "asset-id"?: number;
    };
  };
};

export type IndexerAccountResponse = {
  account?: {
    address?: string;
    assets?: { "asset-id": number; amount: number }[];
  };
};

export async function fetchTransactionById(txId: string): Promise<IndexerTxResponse> {
  const base = getIndexerBase();
  const res = await fetch(`${base}/v2/transactions/${encodeURIComponent(txId)}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Indexer error (${res.status}): ${text || "failed to fetch tx"}`);
  }
  return (await res.json()) as IndexerTxResponse;
}

export async function fetchAccount(address: string): Promise<IndexerAccountResponse> {
  const base = getIndexerBase();
  const res = await fetch(`${base}/v2/accounts/${encodeURIComponent(address)}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Indexer error (${res.status}): ${text || "failed to fetch account"}`);
  }
  return (await res.json()) as IndexerAccountResponse;
}

export function verifyAlgoPaymentTx(params: {
  tx: IndexerTxResponse;
  expectedSender: string;
  expectedReceiver: string;
  expectedMicroAlgos: number;
}): { ok: boolean; reason?: string } {
  const { tx, expectedSender, expectedReceiver, expectedMicroAlgos } = params;
  const t = tx.transaction;
  if (!t) return { ok: false, reason: "Transaction not found" };
  if (!t["confirmed-round"]) return { ok: false, reason: "Transaction not confirmed yet" };
  if ((t.sender || "").toLowerCase() !== expectedSender.toLowerCase()) {
    return { ok: false, reason: "Sender address does not match" };
  }

  const pay = t["payment-transaction"];
  if (!pay) return { ok: false, reason: "Not an ALGO payment transaction" };
  if ((pay.receiver || "").toLowerCase() !== expectedReceiver.toLowerCase()) {
    return { ok: false, reason: "Receiver address does not match" };
  }
  if ((pay.amount || 0) < expectedMicroAlgos) {
    return { ok: false, reason: "Amount is lower than expected" };
  }
  return { ok: true };
}

export function verifyAsaTransferTx(params: {
  tx: IndexerTxResponse;
  expectedSender: string;
  expectedReceiver: string;
  expectedAssetId: number;
  expectedAmount: number;
}): { ok: boolean; reason?: string } {
  const { tx, expectedSender, expectedReceiver, expectedAssetId, expectedAmount } = params;
  const t = tx.transaction;
  if (!t) return { ok: false, reason: "Transaction not found" };
  if (!t["confirmed-round"]) return { ok: false, reason: "Transaction not confirmed yet" };
  if ((t.sender || "").toLowerCase() !== expectedSender.toLowerCase()) {
    return { ok: false, reason: "Sender address does not match" };
  }

  const axfer = t["asset-transfer-transaction"];
  if (!axfer) return { ok: false, reason: "Not an ASA transfer transaction" };
  if ((axfer.receiver || "").toLowerCase() !== expectedReceiver.toLowerCase()) {
    return { ok: false, reason: "Receiver address does not match" };
  }
  if ((axfer["asset-id"] || 0) !== expectedAssetId) {
    return { ok: false, reason: "Asset id does not match" };
  }
  if ((axfer.amount || 0) < expectedAmount) {
    return { ok: false, reason: "Amount is lower than expected" };
  }
  return { ok: true };
}

export async function ensureOptedIn(address: string, assetId: number): Promise<void> {
  const acct = await fetchAccount(address);
  const assets = acct.account?.assets || [];
  const ok = assets.some((a) => a["asset-id"] === assetId);
  if (!ok) {
    throw new Error("Receiver is not opted-in to this ASA");
  }
}

