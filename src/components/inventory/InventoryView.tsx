import { Package, AlertTriangle, MessageSquare } from "lucide-react";
import type { InventoryDecision } from "@/data/types";

const statusConfig = {
  critical: { bg: "bg-destructive/[0.06]", border: "border-destructive/15", text: "text-destructive", dot: "bg-destructive animate-pulse" },
  low:      { bg: "bg-amber-500/[0.04]", border: "border-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  ok:       { bg: "bg-emerald-500/[0.03]", border: "border-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  overstock:{ bg: "bg-primary/[0.03]", border: "border-primary/10", text: "text-primary", dot: "bg-primary" },
};

const InventoryView = ({ data, skuName }: { data: InventoryDecision; skuName: string }) => {
  const urgency = data.stockoutRisk > 0.6 ? "URGENT" : data.stockoutRisk > 0.3 ? "MONITOR" : "STABLE";
  const urgencyColor = data.stockoutRisk > 0.6 ? "text-destructive" : data.stockoutRisk > 0.3 ? "text-amber-400" : "text-emerald-400";

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ─── Header ─── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-foreground">
            Inventory <span className="font-semibold">Decisions</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{skuName}</p>
        </div>
        <div className="text-right">
          <div className="flex items-baseline gap-2 justify-end">
            <p className="text-5xl font-extralight tracking-tighter font-mono-data text-foreground leading-none">
              {data.reorderQty}
            </p>
            <span className="text-sm text-muted-foreground/40">units</span>
          </div>
          <p className="label-micro text-[9px] mt-1">RECOMMENDED REORDER</p>
        </div>
      </div>

      {/* ─── Status Strip ─── */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/15 border border-border/15">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-muted-foreground/50" />
          <span className="text-sm font-mono-data text-foreground">{data.currentStock}</span>
          <span className="text-[10px] text-muted-foreground/40">in stock</span>
        </div>
        <div className="w-px h-5 bg-border/20" />
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-3.5 h-3.5 ${urgencyColor}`} />
          <span className={`text-xs font-semibold ${urgencyColor}`}>{urgency}</span>
        </div>
        <div className="w-px h-5 bg-border/20" />
        <span className="text-xs text-muted-foreground">
          {data.daysUntilStockout} days supply remaining
        </span>
      </div>

      {/* ─── Risk Gauges ─── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Stockout risk */}
        <div className="p-4 rounded-xl bg-card border border-border/20">
          <p className="label-micro text-[9px] mb-3">STOCKOUT RISK</p>
          <div className="flex items-end gap-3">
            <p className={`text-4xl font-light font-mono-data tracking-tighter leading-none
              ${data.stockoutRisk > 0.6 ? "text-destructive" : data.stockoutRisk > 0.3 ? "text-amber-400" : "text-emerald-400"}`}>
              {(data.stockoutRisk * 100).toFixed(0)}%
            </p>
            <div className="flex-1 mb-1">
              <div className="w-full h-2 bg-secondary/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${data.stockoutRisk * 100}%`,
                    background: data.stockoutRisk > 0.6
                      ? "hsl(0 72% 51%)" : data.stockoutRisk > 0.3
                      ? "hsl(38 92% 50%)" : "hsl(152 69% 45%)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Overstock risk */}
        <div className="p-4 rounded-xl bg-card border border-border/20">
          <p className="label-micro text-[9px] mb-3">OVERSTOCK RISK</p>
          <div className="flex items-end gap-3">
            <p className={`text-4xl font-light font-mono-data tracking-tighter leading-none
              ${data.overstockRisk > 0.5 ? "text-primary" : "text-emerald-400"}`}>
              {(data.overstockRisk * 100).toFixed(0)}%
            </p>
            <div className="flex-1 mb-1">
              <div className="w-full h-2 bg-secondary/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${data.overstockRisk * 100}%`,
                    background: data.overstockRisk > 0.5 ? "hsl(217 91% 60%)" : "hsl(152 69% 45%)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Store Heatmap ─── */}
      <div>
        <p className="label-micro text-[9px] mb-3">STORE INVENTORY</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {data.storeBreakdown.map((store) => {
            const cfg = statusConfig[store.status];
            return (
              <div key={store.storeId} className={`rounded-xl p-3 ${cfg.bg} border ${cfg.border} transition-all hover:scale-[1.02]`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                  <span className="text-[11px] text-foreground/80 truncate">{store.storeName}</span>
                </div>
                <p className={`text-lg font-mono-data font-light tracking-tight ${cfg.text}`}>
                  {store.stock}
                </p>
                <p className="text-[9px] text-muted-foreground/40 mt-0.5">{store.daysSupply}d supply</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Decision Reasoning ─── */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-primary/[0.03] to-accent/[0.03] border-l-2 border-primary/25">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-primary/50" />
          <p className="text-xs font-semibold text-foreground">Why this recommendation</p>
        </div>
        <div className="space-y-1.5">
          {data.explanation.map((line, i) => (
            <p key={i} className="text-[12px] text-muted-foreground leading-relaxed pl-6 relative">
              <span className="absolute left-0 text-primary/30">→</span>
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InventoryView;
