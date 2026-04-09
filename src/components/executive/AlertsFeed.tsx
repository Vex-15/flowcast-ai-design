import { AlertTriangle, TrendingUp, Undo2, Package, Zap } from "lucide-react";
import type { OrchestrationAlert } from "@/data/types";
import { getBrand } from "@/data/brands";

const typeIcons: Record<OrchestrationAlert["type"], typeof AlertTriangle> = {
  stockout: AlertTriangle,
  spike: TrendingUp,
  return_anomaly: Undo2,
  overstock: Package,
  intent_signal: Zap,
};

const sevColors: Record<OrchestrationAlert["severity"], string> = {
  critical: "border-destructive/30 bg-destructive/5",
  warning: "border-amber-500/20 bg-amber-500/5",
  info: "border-primary/20 bg-primary/5",
};

const sevDotColors: Record<OrchestrationAlert["severity"], string> = {
  critical: "bg-destructive",
  warning: "bg-amber-400",
  info: "bg-primary",
};

const AlertsFeed = ({ alerts }: { alerts: OrchestrationAlert[] }) => {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Live Alerts</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time supply chain events</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-muted-foreground">Live</span>
        </div>
      </div>

      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
        {alerts.slice(0, 10).map((alert) => {
          const Icon = typeIcons[alert.type];
          const brand = getBrand(alert.brand);
          return (
            <div
              key={alert.id}
              className={`rounded-xl border p-3 transition-all duration-200 hover:scale-[1.01] ${sevColors[alert.severity]}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${sevDotColors[alert.severity]} ${alert.severity === "critical" ? "animate-pulse" : ""}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-foreground truncate">{alert.skuName}</span>
                    <span
                      className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                      style={{
                        background: `hsl(${brand.color} / 0.15)`,
                        color: `hsl(${brand.color})`,
                      }}
                    >
                      {brand.shortName}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{alert.message}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1">{alert.timestamp}</p>
                </div>
                <Icon className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertsFeed;
