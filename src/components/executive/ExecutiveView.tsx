import { useMemo } from "react";
import type { RetailBrainState } from "@/hooks/useRetailBrain";
import { getBrand } from "@/data/brands";
import {
  DollarSign, AlertTriangle, Undo2, Target,
  TrendingUp, TrendingDown, ArrowRight, Zap, Ban, Network,
  Package, Bell, BarChart3,
} from "lucide-react";

// Icon mapping for KPI cards
const iconMap: Record<string, typeof DollarSign> = {
  revenue: DollarSign,
  stockout: AlertTriangle,
  overstock: Package,
  returns: Undo2,
  accuracy: Target,
  alerts: Bell,
};

const ExecutiveView = ({ brain }: { brain: RetailBrainState }) => {
  // Filter alerts and priorities by selected brand
  const filteredAlerts = useMemo(() => {
    if (brain.selectedBrand === "all") return brain.alerts;
    return brain.alerts.filter((a) => a.brand === brain.selectedBrand);
  }, [brain.alerts, brain.selectedBrand]);

  const filteredPriorities = useMemo(() => {
    if (brain.selectedBrand === "all") return brain.priorities;
    return brain.priorities.filter((p) => p.brand === brain.selectedBrand);
  }, [brain.priorities, brain.selectedBrand]);

  const critAlerts = filteredAlerts.filter((a) => a.severity === "critical");
  const warnAlerts = filteredAlerts.filter((a) => a.severity === "warning");

  // Determine positive/negative logic for KPI deltas
  const isNegativeIcon = (icon: string) => ["stockout", "overstock", "alerts"].includes(icon);

  // Selected brand label
  const brandLabel = brain.selectedBrand === "all"
    ? "All Brands"
    : getBrand(brain.selectedBrand).name;

  return (
    <div className="space-y-8 animate-slide-up">
      {/* ─── Hero KPI Strip ─── */}
      <div>
        <h1 className="text-3xl font-light tracking-tight text-foreground mb-1">
          Supply Chain <span className="font-semibold">Overview</span>
        </h1>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
            {brandLabel}
          </span>
        </div>
      </div>

      {/* Dynamic KPI Cards from brain.kpis */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-px bg-border/20 rounded-2xl overflow-hidden">
        {brain.kpis.map((kpi) => {
          const Icon = iconMap[kpi.icon] || DollarSign;
          const isNeg = isNegativeIcon(kpi.icon);
          // For metrics like stockouts / returns: going DOWN is positive
          const isPositiveChange = isNeg
            ? kpi.change < 0
            : kpi.change > 0;
          const changeColor = isPositiveChange ? "text-emerald-400" : "text-destructive";

          return (
            <div key={kpi.label} className="bg-card p-5 group hover:bg-secondary/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="label-micro text-[9px]">{kpi.label.toUpperCase()}</span>
                <Icon className="w-3.5 h-3.5 text-muted-foreground/40" />
              </div>
              <p className="text-3xl font-light tracking-tighter text-foreground font-mono-data leading-none mb-1.5">
                {kpi.value}
              </p>
              <div className="flex items-center gap-1">
                {isPositiveChange ? (
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-destructive" />
                )}
                <span className={`text-xs font-medium ${changeColor} tabular-nums`}>
                  {kpi.change > 0 ? "+" : ""}{kpi.change}%
                </span>
                <span className="text-[10px] text-muted-foreground/40 ml-1">vs last week</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Two-column: Alerts + Risk Table ─── */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Critical Alerts */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Live Alerts</h2>
            <span className="text-[10px] text-muted-foreground/60">{filteredAlerts.length} total</span>
          </div>

          {filteredAlerts.length === 0 && (
            <div className="rounded-xl p-4 bg-emerald-500/[0.04] border border-emerald-500/10 text-center">
              <p className="text-xs text-muted-foreground">No active alerts for {brandLabel}</p>
            </div>
          )}

          {/* Critical */}
          {critAlerts.slice(0, 3).map((alert) => (
            <div
              key={alert.id}
              onClick={() => brain.selectSKUAndNavigate(alert.skuId)}
              className="group cursor-pointer relative overflow-hidden rounded-xl p-3.5 bg-destructive/[0.04] border border-destructive/10
                hover:border-destructive/25 hover:bg-destructive/[0.06] transition-all"
            >
              {/* Ambient glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-destructive/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start gap-3 relative">
                <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 animate-pulse shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground font-medium leading-relaxed">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-muted-foreground">{alert.skuName}</span>
                    <span className="text-[9px] text-muted-foreground/40">{alert.timestamp}</span>
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-foreground/50 transition-colors shrink-0 mt-0.5" />
              </div>
            </div>
          ))}

          {/* Warnings (condensed) */}
          {warnAlerts.slice(0, 4).map((alert) => (
            <div
              key={alert.id}
              onClick={() => brain.selectSKUAndNavigate(alert.skuId)}
              className="group cursor-pointer flex items-center gap-3 rounded-lg px-3 py-2.5
                hover:bg-secondary/40 transition-colors"
            >
              <Zap className="w-3 h-3 text-amber-400/60 shrink-0" />
              <p className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors flex-1 truncate">
                {alert.message}
              </p>
              <span className="text-[9px] text-muted-foreground/30 shrink-0">{alert.timestamp}</span>
            </div>
          ))}
        </div>

        {/* Priority SKU Table */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Priority SKUs</h2>
            <span className="text-[10px] text-muted-foreground/60">
              Ranked by composite risk score · {filteredPriorities.length} SKUs
            </span>
          </div>

          {filteredPriorities.length === 0 && (
            <div className="rounded-xl p-4 bg-secondary/20 border border-border/20 text-center">
              <p className="text-xs text-muted-foreground">No priority SKUs for {brandLabel}</p>
            </div>
          )}

          <div className="space-y-1">
            {/* Table header */}
            {filteredPriorities.length > 0 && (
              <div className="grid grid-cols-12 gap-2 px-3 py-2">
                <span className="col-span-1 label-micro text-[8px]">#</span>
                <span className="col-span-3 label-micro text-[8px]">SKU</span>
                <span className="col-span-2 label-micro text-[8px]">BRAND</span>
                <span className="col-span-2 label-micro text-[8px]">CONCERN</span>
                <span className="col-span-2 label-micro text-[8px]">MIGRATION RISK</span>
                <span className="col-span-2 label-micro text-[8px] text-right">SCORE</span>
              </div>
            )}

            {filteredPriorities.slice(0, 8).map((sku, i) => {
              const brand = getBrand(sku.brand);
              const scoreColor = sku.priorityScore > 70
                ? "text-destructive" : sku.priorityScore > 40
                ? "text-amber-400" : "text-emerald-400";
              
              const migBadge = sku.migrationRisk === "dual_risk"
                ? <span className="inline-flex items-center gap-1 text-[9px] font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded"><AlertTriangle className="w-2.5 h-2.5"/>Dual Risk</span>
                : sku.migrationRisk === "high_absorber"
                ? <span className="inline-flex items-center gap-1 text-[9px] font-medium text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded"><Network className="w-2.5 h-2.5"/>High Absorber</span>
                : sku.migrationRisk === "source_at_risk"
                ? <span className="inline-flex items-center gap-1 text-[9px] font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded"><ArrowRight className="w-2.5 h-2.5"/>Source Risk</span>
                : <span className="inline-flex items-center gap-1 text-[9px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">None</span>;

              return (
                <div
                  key={sku.skuId}
                  onClick={() => brain.selectSKUAndNavigate(sku.skuId)}
                  className="group grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-lg cursor-pointer
                    hover:bg-secondary/40 transition-all border border-transparent hover:border-border/30"
                >
                  <span className="col-span-1 text-[11px] text-muted-foreground/40 font-mono-data">{i + 1}</span>
                  <span className="col-span-3 text-[12px] text-foreground font-medium truncate group-hover:text-primary transition-colors pr-2">
                    {sku.skuName}
                  </span>
                  <span
                    className="col-span-2 text-[10px] font-medium truncate pr-2"
                    style={{ color: `hsl(${brand.color})` }}
                  >
                    {brand.shortName}
                  </span>
                  <span className="col-span-2 text-[10px] text-muted-foreground truncate pr-2">{sku.primaryConcern}</span>
                  <div className="col-span-2 flex items-center pr-2">
                     {migBadge}
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <div className="w-12 h-1 bg-secondary/50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${sku.priorityScore}%`,
                          background: sku.priorityScore > 70
                            ? "hsl(0 72% 51%)" : sku.priorityScore > 40
                            ? "hsl(38 92% 50%)" : "hsl(152 69% 45%)",
                        }}
                      />
                    </div>
                    <span className={`text-xs font-mono-data font-semibold ${scoreColor} w-6 text-right`}>
                      {sku.priorityScore}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveView;
