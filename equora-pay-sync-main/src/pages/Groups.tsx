import DashboardLayout from "@/components/DashboardLayout";
import { Users, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCurrency, formatCurrency, convertCurrency } from "@/lib/currency";
import { useAppData } from "@/lib/appData";

const Groups = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const { baseCurrency } = useCurrency();
  const { groups, expenses, users, currentUser, addGroup } = useAppData();

  const createGroup = async () => {
    if (!newName.trim()) {
      toast.error("Please enter a group name");
      return;
    }
    try {
      await addGroup({
        name: newName.trim(),
        emoji: "👥",
        memberIds: [currentUser.id],
      });
      toast.success(`Group "${newName.trim()}" created!`);
      setNewName("");
      setShowCreate(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create group";
      toast.error("Could not create group", { description: message });
    }
  };

  const getGroupExpenseTotal = (groupId: string) => {
    return expenses
      .filter((e) => e.groupId === groupId)
      .reduce((sum, e) => sum + convertCurrency(e.amount, e.currency, baseCurrency), 0);
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display gold-text">Groups</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your expense groups</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="gold-btn text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> New Group</button>
      </div>

      {showCreate && (
        <div className="glass-card p-4 mb-6 flex gap-3">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Group name..." className="flex-1 bg-input border border-border rounded-[14px] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
          <button onClick={createGroup} className="gold-btn text-sm">Create</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => {
          const total = getGroupExpenseTotal(group.id);
          return (
            <div key={group.id} className="glass-card-hover p-5 cursor-pointer">
              <div className="text-3xl mb-3">{group.emoji}</div>
              <h3 className="font-display gold-text">{group.name}</h3>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Users className="w-3.5 h-3.5 text-primary/60" /> {group.memberIds.length} members
                </div>
                <div className="text-sm">
                  <span className="text-primary font-medium">{formatCurrency(total, baseCurrency)}</span>
                </div>
              </div>
              <div className="mt-3 flex -space-x-2">
                {group.memberIds.slice(0, 5).map((uid) => {
                  const u = users.find((u) => u.id === uid);
                  return (
                    <div key={uid} className="w-7 h-7 rounded-full border-2 border-card flex items-center justify-center text-primary text-xs font-semibold bg-primary/10">
                      {u?.name.charAt(0)}
                    </div>
                  );
                })}
                {group.memberIds.length > 5 && (
                  <div className="w-7 h-7 rounded-full border-2 border-card flex items-center justify-center text-muted-foreground text-xs bg-muted">
                    +{group.memberIds.length - 5}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default Groups;
