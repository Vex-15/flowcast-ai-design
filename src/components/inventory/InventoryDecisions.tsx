import { Package, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import type { InventoryDecision } from "@/data/types";
import DecisionExplainer from "./DecisionExplainer";

const statusColors = {
  critical: { bg: "bg-destructive/15", text: "text-destructive", dot: "bg-destructive" },
  low: { bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" },
  ok: { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
  overstock: { bg: "bg-primary/15", text: "text-primary", dot: "bg-primary" },
};

const InventoryDecisions = ({ data, skuName }: { data: InventoryDecision; skuName: string }) => {
  return (
    <div className="space-y-5">
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Inventory Decision Engine</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{skuName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground tabular-nums">
              {data.currentStock} units
            </span>
          </div>
        </div>

        {/* Primary metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="rounded-xl bg-secondary/30 border border-border/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-primary" />
              <span className="text-[10px] text-muted-foreground font-medium">Reorder Qty</span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{data.reorderQty}</p>
            <p className="text-[10px] text-muted-foreground">units recommended</p>
          </div>

          <div className="rounded-xl bg-secondary/30 border border-border/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] text-muted-foreground font-medium">Stockout Risk</span>
            </div>
            <p className={`text-2xl font-bold tabular-nums ${
              data.stockoutRisk > 0.6 ? "text-destructive" : data.stockoutRisk > 0.3 ? "text-amber-400" : "text-emerald-400"
            }`}>
              {(data.stockoutRisk * 100).toFixed(0)}%
            </p>
            <p className="text-[10px] text-muted-foreground">{data.daysUntilStockout} days to stockout</p>
          </div>

          <div className="rounded-xl bg-secondary/30 border border-border/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-primary" />
              <span className="text-[10px] text-muted-foreground font-medium">Overstock Risk</span>
            </div>
            <p className={`text-2xl font-bold tabular-nums ${
              data.overstockRisk > 0.5 ? "text-primary" : "text-emerald-400"
            }`}>
              {(data.overstockRisk * 100).toFixed(0)}%
            </p>
            <p className="text-[10px] text-muted-foreground">excess inventory risk</p>
          </div>

          <div className="rounded-xl bg-secondary/30 border border-border/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] text-muted-foreground font-medium">Days Supply</span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{data.daysUntilStockout}</p>
            <p className="text-[10px] text-muted-foreground">at current velocity</p>
          </div>
        </div>

        {/* Store breakdown */}
        <h4 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">Store Inventory Heatmap</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {data.storeBreakdown.map((store) => {
            const st = statusColors[store.status];
            return (
              <div key={store.storeId} className={`rounded-xl border border-border/15 p-3 ${st.bg}`}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${store.status === "critical" ? "animate-pulse" : ""}`} />
                  <span className="text-[10px] font-medium text-foreground truncate">{store.storeName}</span>
                </div>
                <p className={`text-sm font-bold tabular-nums ${st.text}`}>{store.stock} units</p>
                <p className="text-[9px] text-muted-foreground">{store.daysSupply} days supply</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Decision Explainer */}
      <DecisionExplainer explanation={data.explanation} reorderQty={data.reorderQty} />
    </div>
  );
};

export default InventoryDecisions;
