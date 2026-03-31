/**
 * 🔌 Realtime Database Scan Sync (Phase 2)
 * Use for live barcode scan events across devices
 * Example: when user A scans a code, user B sees it immediately
 */

import { rtdb } from "./firebase";
import { ref, set, onValue, off, remove } from "firebase/database";

export interface ScanSession {
  scannedBy: string; // userId
  result: string; // scanned barcode/QR value
  timestamp: number; // Date.now()
  format?: string; // QR_CODE, AZTEC, etc.
  billId?: string; // optional linked bill
}

// ─── Start a live scan session ───
export async function startScanSession(
  sessionId: string,
  scan: ScanSession
): Promise<void> {
  if (!rtdb) {
    console.warn("Realtime Database not configured");
    return;
  }

  try {
    await set(ref(rtdb, `scanSessions/${sessionId}`), scan);
  } catch (error) {
    console.error("Error starting scan session:", error);
    throw error;
  }
}

// ─── Listen to scan events in real-time ───
export function listenToScan(
  sessionId: string,
  onData: (scan: ScanSession | null) => void
): () => void {
  if (!rtdb) {
    console.warn("Realtime Database not configured");
    return () => {};
  }

  const scanRef = ref(rtdb, `scanSessions/${sessionId}`);
  onValue(scanRef, (snapshot) => {
    const data = snapshot.val() as ScanSession | null;
    onData(data);
  });

  // Return unsubscribe function
  return () => {
    off(scanRef);
  };
}

// ─── Clear scan session ───
export async function clearScanSession(sessionId: string): Promise<void> {
  if (!rtdb) {
    console.warn("Realtime Database not configured");
    return;
  }

  try {
    await remove(ref(rtdb, `scanSessions/${sessionId}`));
  } catch (error) {
    console.error("Error clearing scan session:", error);
    throw error;
  }
}

// ─── Broadcast scan to group ───
/**
 * Share a scanned code with all members of a group
 * Useful for: group bill creation, synchronized scanning
 */
export async function broadcastScanToGroup(
  groupId: string,
  scan: ScanSession
): Promise<void> {
  if (!rtdb) {
    console.warn("Realtime Database not configured");
    return;
  }

  try {
    const timestamp = Date.now();
    await set(ref(rtdb, `groupScans/${groupId}/${timestamp}`), scan);
  } catch (error) {
    console.error("Error broadcasting scan:", error);
    throw error;
  }
}

// ─── Listen to group scans ───
export function listenToGroupScans(
  groupId: string,
  onData: (scans: Record<string, ScanSession>) => void
): () => void {
  if (!rtdb) {
    console.warn("Realtime Database not configured");
    return () => {};
  }

  const groupRef = ref(rtdb, `groupScans/${groupId}`);
  onValue(groupRef, (snapshot) => {
    const data = (snapshot.val() as Record<string, ScanSession>) || {};
    onData(data);
  });

  return () => {
    off(groupRef);
  };
}
