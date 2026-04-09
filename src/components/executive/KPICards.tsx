import { DollarSign, AlertTriangle, Package, Undo2, Target, Bell } from "lucide-react";
import type { KPI } from "@/data/types";

const iconMap: Record<string, typeof DollarSign> = {
  revenue: DollarSign,
  stockout: AlertTriangle,
  overstock: Package,
  returns: Undo2,
  accuracy: Target,
  alerts: Bell,
};

const KPICards = ({ kpis }: { kpis: KPI[] }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpis.map((kpi) => {
        const Icon = iconMap[kpi.icon] || DollarSign;
        const isPositive = kpi.trend === "up" && !["stockout", "overstock", "alerts"].includes(kpi.icon);
        const isNegative = kpi.trend === "up" && ["stockout", "overstock", "alerts"].includes(kpi.icon);
        const changeColor = isNegative
          ? "text-destructive"
          : isPositive || (kpi.trend === "down" && ["stockout", "returns"].includes(kpi.icon))
          ? "text-emerald-400"
          : "text-muted-foreground";

        return (
          <div
            key={kpi.label}
            className="glass rounded-2xl p-4 hover:bg-card/80 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className={`text-xs font-medium ${changeColor} tabular-nums`}>
                {kpi.change > 0 ? "+" : ""}
                {kpi.change}%
              </span>
            </div>
            <p className="text-xl font-bold text-foreground tabular-nums">{kpi.value}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{kpi.label}</p>
          </div>
        );
      })}
    </div>
  );
};

export default KPICards;
