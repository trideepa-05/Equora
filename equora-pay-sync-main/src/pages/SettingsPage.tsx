import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { User, Bell, Wallet, Save, Globe } from "lucide-react";
import { toast } from "sonner";
import { CURRENCIES, CurrencyCode, useCurrency } from "@/lib/currency";

const SettingsPage = () => {
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john@equora.io");
  const [wallet, setWallet] = useState("");
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const { baseCurrency, setBaseCurrency } = useCurrency();

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display gold-text">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile and preferences</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="glass-card p-5">
          <h2 className="font-display gold-text flex items-center gap-2 mb-4"><User className="w-4 h-4 text-primary" /> Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-input border border-border rounded-[14px] px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-colors" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full bg-input border border-border rounded-[14px] px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-colors" />
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="font-display gold-text flex items-center gap-2 mb-4"><Globe className="w-4 h-4 text-primary" /> Currency Preferences</h2>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Base Currency</label>
            <p className="text-xs text-muted-foreground mb-2">All amounts across the app will show conversions to this currency.</p>
            <select
              value={baseCurrency}
              onChange={(e) => {
                setBaseCurrency(e.target.value as CurrencyCode);
                toast.success(`Base currency set to ${e.target.value}`);
              }}
              className="w-full bg-input border border-border rounded-[14px] px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-colors"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="font-display gold-text flex items-center gap-2 mb-4"><Bell className="w-4 h-4 text-primary" /> Notifications</h2>
          <div className="space-y-3">
            {[
              { label: "Email Notifications", value: emailNotif, setter: setEmailNotif },
              { label: "Push Notifications", value: pushNotif, setter: setPushNotif },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border">
                <span className="text-sm text-foreground">{item.label}</span>
                <button
                  onClick={() => item.setter(!item.value)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${item.value ? "bg-primary" : "bg-muted"}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${item.value ? "bg-primary-foreground left-[22px]" : "bg-muted-foreground left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="font-display gold-text flex items-center gap-2 mb-4"><Wallet className="w-4 h-4 text-primary" /> Wallet</h2>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Wallet Address (Optional)</label>
            <input value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="0x..." className="w-full bg-input border border-border rounded-[14px] px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors font-mono text-sm" />
          </div>
        </div>

        <button onClick={() => toast.success("Settings saved!")} className="gold-btn flex items-center gap-2">
          <Save className="w-4 h-4" /> Save Changes
        </button>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
