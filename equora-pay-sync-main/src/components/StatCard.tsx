import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
}

const StatCard = ({ title, value, icon: Icon, trend }: StatCardProps) => (
  <div className="glass-card-hover p-5">
    <div className="flex items-start justify-between mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
        <Icon className="w-5 h-5" />
      </div>
      {trend && <span className="text-xs text-primary/70 font-medium">{trend}</span>}
    </div>
    <p className="text-2xl font-display gold-text font-bold">{value}</p>
    <p className="text-sm text-muted-foreground mt-1">{title}</p>
  </div>
);

export default StatCard;
