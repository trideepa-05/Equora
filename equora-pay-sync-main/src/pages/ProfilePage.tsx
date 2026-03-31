import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Save, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/lib/appData";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function ProfilePage() {
  const { user } = useAuth();
  const { currentUser } = useAppData();

  const initial = useMemo(() => {
    return {
      name: user?.displayName || currentUser.name || "",
      email: user?.email || currentUser.email || "",
      upiId: currentUser.upiId || "",
      algoAddress: currentUser.algoAddress || "",
    };
  }, [user, currentUser]);

  const [name, setName] = useState(initial.name);
  const [upiId, setUpiId] = useState(initial.upiId);
  const [algoAddress, setAlgoAddress] = useState(initial.algoAddress);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(initial.name);
    setUpiId(initial.upiId);
    setAlgoAddress(initial.algoAddress);
  }, [initial.name, initial.upiId, initial.algoAddress]);

  const save = async () => {
    if (!user) return;
    const trimmedName = name.trim();
    const trimmedUpi = upiId.trim();
    const trimmedAlgo = algoAddress.trim();
    if (!trimmedName) {
      toast.error("Name is required");
      return;
    }
    if (trimmedUpi && !trimmedUpi.includes("@")) {
      toast.error("UPI ID looks invalid", { description: "Example: name@upi" });
      return;
    }
    if (trimmedAlgo && trimmedAlgo.length < 40) {
      toast.error("Algorand address looks invalid");
      return;
    }
    if (!db) {
      toast.error("Database not configured");
      return;
    }

    setSaving(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          name: trimmedName,
          email: user.email,
          upiId: trimmedUpi || null,
          algoAddress: trimmedAlgo || null,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      toast.success("Profile updated");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to update profile";
      toast.error("Update failed", { description: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display gold-text flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-primary" /> Profile
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Your account details and payment settings</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="premium-card p-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Full Name</label>
              <input className="w-full input mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Email</label>
              <input className="w-full input mt-1.5 opacity-80" value={initial.email} readOnly />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide">UPI ID</label>
              <input
                className="w-full input mt-1.5"
                placeholder="yourname@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-2">
                This is used for the “Pay via UPI” deep link and QR.
              </p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Algorand Address</label>
              <input
                className="w-full input mt-1.5 font-mono"
                placeholder="Your ALGO address"
                value={algoAddress}
                onChange={(e) => setAlgoAddress(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Used to verify on-chain payments (tx confirmation) and build the immutable ledger.
              </p>
            </div>
          </div>

          <button
            onClick={() => void save()}
            disabled={saving}
            className="mt-6 gold-btn flex items-center gap-2 disabled:opacity-60"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

