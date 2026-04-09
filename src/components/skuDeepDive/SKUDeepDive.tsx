import type { RetailBrainState } from "@/hooks/useRetailBrain";
import { getBrand } from "@/data/brands";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import { Package, AlertTriangle, Undo2, MapPin, Tag, ArrowRight } from "lucide-react";

const SKUDeepDive = ({ brain }: { brain: RetailBrainState }) => {
  const sku = brain.currentSKU;
  const brand = getBrand(sku.brand);
  const inv = brain.inventoryDecision;
  const ret = brain.returnAnalysis;

  // Mini forecast for sparkline
  const sparkData = brain.forecast.slice(0, 7);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ─── Product Header ─── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
              style={{ background: `hsl(${brand.color} / 0.12)`, color: `hsl(${brand.color})` }}
            >
              {brand.name}
            </span>
            <span className="text-[10px] text-muted-foreground/30 font-mono-data">{sku.id}</span>
          </div>
          <h1 className="text-3xl font-light tracking-tight text-foreground">{sku.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sku.category} · <span className="font-mono-data">${sku.price.toLocaleString()}</span>
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <Tag className="w-3 h-3 text-muted-foreground/30" />
            {sku.seasonalPeak.map((s) => (
              <span key={s} className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/[0.06] text-amber-400/70 border border-amber-500/10">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-light font-mono-data text-foreground tracking-tight">{inv.currentStock}</p>
            <p className="label-micro text-[8px] mt-0.5">UNITS</p>
          </div>
          <div className="w-px h-8 bg-border/20" />
          <div className="text-center">
            <p className={`text-2xl font-light font-mono-data tracking-tight ${
              inv.stockoutRisk > 0.5 ? "text-destructive" : "text-emerald-400"
            }`}>{(inv.stockoutRisk * 100).toFixed(0)}%</p>
            <p className="label-micro text-[8px] mt-0.5">STOCKOUT</p>
          </div>
          <div className="w-px h-8 bg-border/20" />
          <div className="text-center">
            <p className={`text-2xl font-light font-mono-data tracking-tight ${
              ret.returnRate > 0.1 ? "text-amber-400" : "text-foreground"
            }`}>{(ret.returnRate * 100).toFixed(1)}%</p>
            <p className="label-micro text-[8px] mt-0.5">RETURNS</p>
          </div>
          <div className="w-px h-8 bg-border/20" />
          <div className="text-center">
            <p className="text-2xl font-light font-mono-data text-foreground tracking-tight">{sku.stores.length}</p>
            <p className="label-micro text-[8px] mt-0.5">STORES</p>
          </div>
        </div>
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Demand Sparkline (tall) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border/15">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-foreground">7-Day Demand</p>
            <span className="text-[10px] font-mono-data text-emerald-400">94.1% acc.</span>
          </div>
          <div className="h-[200px] -mx-2 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={brain.forecast} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="skuSparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(220 10% 36%)" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: "hsl(225 15% 9%)", border: "1px solid hsl(225 12% 16%)", borderRadius: "10px", fontSize: "11px" }}
                />
                <Area type="monotone" dataKey="actual" stroke="hsl(217 91% 60%)" strokeWidth={2} fill="url(#skuSparkGrad)" dot={false} connectNulls={false} />
                <Area type="monotone" dataKey="predicted" stroke="hsl(265 60% 62%)" strokeWidth={1.5} strokeDasharray="4 4" fill="none" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Decomposition pill */}
        <div className="p-5 rounded-2xl bg-card border border-border/15">
          <p className="text-sm font-semibold text-foreground mb-4">Decomposition</p>
          {(() => {
            const latest = brain.decomposition[brain.decomposition.length - 1];
            return (
              <div className="space-y-4">
                {[
                  { label: "BASE", value: latest.base, color: "text-primary" },
                  { label: "FESTIVAL", value: `+${latest.festivalBoost}`, color: "text-amber-400" },
                  { label: "PROMO", value: `+${latest.promotionBoost}`, color: "text-emerald-400" },
                  { label: "WEATHER", value: latest.weatherImpact >= 0 ? `+${latest.weatherImpact}` : `${latest.weatherImpact}`, color: "text-cyan-400" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="label-micro text-[8px]">{item.label}</span>
                    <span className={`text-xl font-light font-mono-data tracking-tight ${item.color}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
                <div className="border-t border-border/15 pt-3 flex items-center justify-between">
                  <span className="label-micro text-[8px]">TOTAL</span>
                  <span className="text-2xl font-semibold font-mono-data text-foreground tracking-tighter">
                    {latest.total}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ─── Bottom Row: Signals + Returns + Inventory ─── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Signal Confidence */}
        <div className="p-5 rounded-2xl bg-card border border-border/15">
          <p className="text-sm font-semibold text-foreground mb-4">Signal Confidence</p>
          {brain.signalFusion.signals.slice(0, 4).map((s) => (
            <div key={s.name} className="flex items-center gap-2 mb-2.5">
              <span className="text-[11px] text-foreground/60 w-28 truncate">{s.name}</span>
              <div className="flex-1 h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${s.value * 100}%`,
                    background: s.type === "internal" ? "hsl(217 91% 60%)" : "hsl(265 60% 62%)",
                  }}
                />
              </div>
              <span className="text-[10px] font-mono-data text-muted-foreground w-8 text-right">{(s.value * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>

        {/* Return snapshot */}
        <div className="p-5 rounded-2xl bg-card border border-border/15">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-foreground">Returns</p>
            <span className={`text-[10px] font-mono-data font-semibold ${ret.riskScore > 50 ? "text-destructive" : "text-muted-foreground"}`}>
              Risk {ret.riskScore}/100
            </span>
          </div>
          <div className="space-y-2">
            {ret.reasons.slice(0, 3).map((r) => (
              <div key={r.reason} className="flex items-center gap-2">
                <div className="flex-1 h-5 rounded bg-secondary/20 overflow-hidden relative">
                  <div
                    className="h-full rounded bg-destructive/15"
                    style={{ width: `${r.percentage}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-2 text-[10px] text-foreground/50 truncate">
                    {r.reason}
                  </span>
                </div>
                <span className="text-[10px] font-mono-data text-muted-foreground w-8 text-right">{r.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory snapshot */}
        <div className="p-5 rounded-2xl bg-card border border-border/15">
          <p className="text-sm font-semibold text-foreground mb-4">Inventory</p>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-light font-mono-data text-foreground tracking-tighter">{inv.reorderQty}</span>
            <span className="text-xs text-muted-foreground/40">units to reorder</span>
          </div>
          <div className="space-y-1.5">
            {inv.storeBreakdown.slice(0, 4).map((s) => (
              <div key={s.storeId} className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  s.status === "critical" ? "bg-destructive animate-pulse" :
                  s.status === "low" ? "bg-amber-400" : "bg-emerald-400"
                }`} />
                <span className="text-[11px] text-foreground/60 flex-1 truncate">{s.storeName}</span>
                <span className="text-[10px] font-mono-data text-muted-foreground">{s.stock}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SKUDeepDive;
