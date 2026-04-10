import { useState, useEffect, useMemo } from "react";
import type { RetailBrainState } from "@/hooks/useRetailBrain";
import { getSKU, getBrand } from "@/data/brands";
import {
  AlertTriangle, Heart, Calendar, Users, Package,
  TrendingUp, Clock, Gift, Home, Baby, PartyPopper,
  ArrowRight, Zap, BarChart3,
} from "lucide-react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";

// ─── Animated Counter ──────────────────────────────────────
const AnimatedNumber = ({ value, prefix = "", suffix = "", decimals = 0 }: {
  value: number; prefix?: string; suffix?: string; decimals?: number;
}) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1200;
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(eased * value);
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{prefix}{display.toFixed(decimals)}{suffix}</>;
};

// ─── Demand Split Ring ─────────────────────────────────────
const DemandSplitRing = ({ registryShare }: { registryShare: number }) => {
  const [animatedShare, setAnimatedShare] = useState(0);
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - start) / 1200, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedShare(eased * registryShare);
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [registryShare]);

  const size = 110;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const registryLength = animatedShare * circumference;
  const organicLength = (1 - animatedShare) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
      {/* Organic (blue) */}
      <circle cx={center} cy={center} r={radius} fill="none"
        stroke="hsl(217 91% 60%)" strokeWidth={strokeWidth} strokeOpacity={0.25}
        strokeDasharray={`${organicLength} ${circumference}`} strokeDashoffset={0}
        strokeLinecap="round" style={{ transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
      {/* Registry (purple) */}
      <circle cx={center} cy={center} r={radius} fill="none"
        stroke="hsl(265 60% 62%)" strokeWidth={strokeWidth} strokeOpacity={0.7}
        strokeDasharray={`${registryLength} ${circumference}`} strokeDashoffset={-organicLength}
        strokeLinecap="round" style={{ transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
    </svg>
  );
};

// ─── Event type config ─────────────────────────────────────
const eventConfig: Record<string, { bg: string; text: string; border: string; label: string; icon: any; glow: string }> = {
  wedding:      { bg: "bg-amber-500/[0.06]",  text: "text-amber-400",   border: "border-amber-500/20",  label: "Wedding",      icon: Heart,       glow: "bg-amber-400/5" },
  baby:         { bg: "bg-purple-500/[0.06]",  text: "text-purple-400",  border: "border-purple-500/20", label: "Baby Shower",   icon: Baby,        glow: "bg-purple-400/5" },
  housewarming: { bg: "bg-emerald-500/[0.06]", text: "text-emerald-400", border: "border-emerald-500/20",label: "Housewarming",  icon: Home,        glow: "bg-emerald-400/5" },
  birthday:     { bg: "bg-cyan-500/[0.06]",    text: "text-cyan-400",    border: "border-cyan-500/20",   label: "Birthday",     icon: PartyPopper, glow: "bg-cyan-400/5" },
};

// ─── Custom Tooltip ────────────────────────────────────────
const WaveTooltip = ({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;
  const total = data.organicUnits + data.registryUnits;
  const regPct = total > 0 ? ((data.registryUnits / total) * 100).toFixed(0) : "0";
  return (
    <div className="bg-card/95 backdrop-blur-xl border border-border/40 rounded-xl px-4 py-3 shadow-2xl">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-3 h-3 text-muted-foreground/50" />
        <p className="text-xs font-semibold text-foreground">Week of {data.weekLabel}</p>
      </div>
      <div className="space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary/40 inline-block" />
            <span className="text-muted-foreground">Organic</span>
          </span>
          <span className="font-mono-data text-primary font-medium">{data.organicUnits} units</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400/70 inline-block" />
            <span className="text-muted-foreground">Registry</span>
          </span>
          <span className="font-mono-data text-purple-400 font-medium">{data.registryUnits} units</span>
        </div>
        <div className="flex items-center justify-between gap-6 border-t border-border/20 pt-1.5">
          <span className="text-muted-foreground">Total</span>
          <span className="font-mono-data text-foreground font-semibold">{total} units</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Registry Share</span>
          <span className="font-mono-data text-purple-400">{regPct}%</span>
        </div>
        {data.registryCount > 0 && (
          <div className="flex items-center justify-between gap-6">
            <span className="text-muted-foreground">Active Registries</span>
            <span className="font-mono-data text-muted-foreground">{data.registryCount}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────
const RegistryDemandView = ({ brain }: { brain: RetailBrainState }) => {
  const sku = getSKU(brain.selectedSKU);
  const brand = getBrand(sku.brand);
  const reg = brain.registryDemand;

  const daysColor = (days: number) =>
    days < 14 ? "text-destructive" : days <= 30 ? "text-amber-400" : "text-muted-foreground/70";

  const daysUrgency = (days: number) =>
    days < 14 ? "Urgent" : days <= 30 ? "Soon" : "";

  // Event type breakdown for summary
  const eventBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    reg.events.forEach(e => { counts[e.eventType] = (counts[e.eventType] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [reg.events]);

  // Total organic for ratio
  const totalOrganic = reg.weeklyWave.reduce((s, w) => s + w.organicUnits, 0);
  const totalAll = totalOrganic + reg.totalProjectedRegistryUnits;

  // Chart data with total line
  const chartData = reg.weeklyWave.map(w => ({
    ...w,
    cumulativeRegistry: 0, // placeholder
  }));

  // Running cumulative
  let cumReg = 0;
  chartData.forEach(w => {
    cumReg += w.registryUnits;
    w.cumulativeRegistry = cumReg;
  });

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ─── Hero Header ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border/60 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/[0.02] rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-start justify-between">
          <div className="flex items-start gap-5">
            {/* Demand Split Ring */}
            <div className="relative shrink-0">
              <DemandSplitRing registryShare={reg.registryShareOfDemand} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-lg font-light font-mono-data text-foreground leading-none">
                  {(reg.registryShareOfDemand * 100).toFixed(0)}%
                </p>
                <p className="text-[7px] text-muted-foreground/50 font-semibold tracking-wider uppercase mt-0.5">REGISTRY</p>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-light tracking-tight text-foreground">
                Registry <span className="font-semibold">Demand Intelligence</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Structured future demand from active gift registries</p>
              {/* Event type pills */}
              <div className="flex items-center gap-2 mt-3">
                {eventBreakdown.map(([type, count]) => {
                  const cfg = eventConfig[type] || eventConfig.birthday;
                  const Icon = cfg.icon;
                  return (
                    <span key={type} className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-1 rounded-lg ${cfg.bg} ${cfg.text} ${cfg.border} border`}>
                      <Icon className="w-3 h-3" />
                      {count} {cfg.label}{count > 1 ? "s" : ""}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-5xl font-extralight font-mono-data tracking-tighter text-foreground leading-none">
              <AnimatedNumber value={reg.activeRegistries} />
            </p>
            <p className="label-micro text-[8px] mt-2">ACTIVE REGISTRIES</p>
          </div>
        </div>
      </div>

      {/* ─── AI Insight Card ─── */}
      <div className="relative overflow-hidden p-5 rounded-2xl bg-accent/[0.03] border border-accent/15">
        <div className="absolute top-3 right-4 opacity-[0.05]">
          <Zap className="w-16 h-16" />
        </div>
        <div className="relative flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-xs font-semibold text-accent mb-1">Registry Intelligence Insight</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{reg.insight}</p>
          </div>
        </div>
      </div>

      {/* ─── KPI Strip: 4 tiles with icons ─── */}
      <div className="grid grid-cols-4 gap-px bg-border/20 rounded-2xl overflow-hidden">
        {[
          {
            label: "REVENUE AT STAKE", value: `$${reg.registryRevenueAtStake.toLocaleString()}`,
            icon: TrendingUp, color: "text-foreground",
            sub: `${reg.totalProjectedRegistryUnits} units × $${sku.price.toLocaleString()}`,
          },
          {
            label: "DEMAND SHARE", value: `${(reg.registryShareOfDemand * 100).toFixed(0)}%`,
            icon: BarChart3, color: "text-purple-400",
            sub: `${reg.totalProjectedRegistryUnits} of ${totalAll} total units`,
          },
          {
            label: "PEAK WEEK", value: reg.peakRegistryWeek,
            icon: Calendar, color: "text-amber-400",
            sub: `${reg.peakRegistryUnits} registry units`,
          },
          {
            label: "INVENTORY GAP",
            value: reg.inventoryGap > 0 ? `${reg.inventoryGap} units` : "No Gap",
            icon: Package,
            color: reg.inventoryGap > 0 ? "text-destructive" : "text-emerald-400",
            sub: reg.inventoryGap > 0 ? "Stock shortfall projected" : "Sufficient stock available",
          },
        ].map((tile) => (
          <div key={tile.label} className="bg-card p-4 group hover:bg-secondary/20 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="label-micro text-[8px]">{tile.label}</p>
              <tile.icon className="w-3.5 h-3.5 text-muted-foreground/30" />
            </div>
            <p className={`text-2xl font-light font-mono-data tracking-tight ${tile.color}`}>
              {tile.value}
            </p>
            <p className="text-[10px] text-muted-foreground/50 mt-1 font-mono-data">{tile.sub}</p>
          </div>
        ))}
      </div>

      {/* ─── Weekly Wave Chart ─── */}
      <div className="p-6 rounded-2xl bg-card border border-border/60 surface-glow">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm font-semibold text-foreground">Weekly Demand Wave</p>
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">
              8-week stacked forecast · organic + registry demand
            </p>
          </div>
          <div className="flex items-center gap-5 text-[10px] text-muted-foreground/60">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-primary/25 rounded-sm inline-block border border-primary/30" /> Organic
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-purple-500/40 rounded-sm inline-block border border-purple-500/30" /> Registry
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-foreground/40 rounded-full inline-block" /> Total
            </span>
          </div>
        </div>
        <div className="-mx-6" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="organicGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity={0.08} />
                </linearGradient>
                <linearGradient id="registryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(265 60% 62%)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="hsl(265 60% 62%)" stopOpacity={0.15} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.25} />
              <XAxis
                dataKey="weekLabel"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={{ stroke: "hsl(var(--border))", strokeOpacity: 0.3 }}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={false} tickLine={false}
                label={{ value: "Units", angle: -90, position: "insideLeft", style: { fill: "hsl(var(--muted-foreground))", fontSize: 9, opacity: 0.4 } }}
              />
              <Tooltip content={<WaveTooltip />} />

              <Bar dataKey="organicUnits" name="Organic" stackId="demand"
                fill="url(#organicGradient)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="registryUnits" name="Registry" stackId="demand"
                fill="url(#registryGradient)" radius={[4, 4, 0, 0]} />

              {/* Total line on top */}
              <Line type="monotone" dataKey="totalUnits" name="Total"
                stroke="hsl(var(--foreground))" strokeWidth={1.5} strokeOpacity={0.3}
                dot={false} strokeDasharray="4 4" />

              <ReferenceLine x={reg.peakRegistryWeek}
                stroke="hsl(38 92% 50%)" strokeDasharray="6 4" strokeWidth={1.5}
                label={{ value: "Peak Week", position: "top", fill: "hsl(38 92% 50%)", fontSize: 10, fontWeight: 600 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Event Timeline ─── */}
      <div className="rounded-2xl p-5 bg-card border border-border/60">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
            <Gift className="w-3.5 h-3.5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Upcoming Registry Events</p>
            <p className="text-[10px] text-muted-foreground/50">Top 5 registries driving structured demand</p>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {reg.events.map((evt, idx) => {
            const cfg = eventConfig[evt.eventType] || eventConfig.birthday;
            const Icon = cfg.icon;
            const isUrgent = evt.daysUntilEvent < 14;
            const isSoon = evt.daysUntilEvent <= 30 && !isUrgent;
            const purchaseRevenue = evt.projectedUnits * sku.price;

            return (
              <div
                key={evt.registryId}
                className={`relative min-w-[220px] p-4 rounded-2xl shrink-0 border transition-all hover:scale-[1.02] hover:shadow-lg
                  ${cfg.bg} ${cfg.border}
                  ${isUrgent ? "ring-1 ring-destructive/20" : ""}`}
              >
                {/* Ambient glow */}
                <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl pointer-events-none ${cfg.glow}`} />

                {/* Header */}
                <div className="relative flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-md ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                  {(isUrgent || isSoon) && (
                    <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded ${isUrgent ? "bg-destructive/15 text-destructive" : "bg-amber-500/15 text-amber-400"}`}>
                      {daysUrgency(evt.daysUntilEvent)}
                    </span>
                  )}
                </div>

                {/* Date + Countdown */}
                <p className="text-lg font-semibold text-foreground">{evt.eventDate}</p>
                <div className={`flex items-center gap-1 mt-0.5 ${daysColor(evt.daysUntilEvent)}`}>
                  <Clock className="w-3 h-3" />
                  <span className="text-[11px] font-mono-data font-medium">{evt.daysUntilEvent} days away</span>
                </div>

                {/* Divider */}
                <div className="border-t border-border/20 my-3" />

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[8px] text-muted-foreground/50 uppercase tracking-wide mb-0.5">Guests</p>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-muted-foreground/40" />
                      <span className="text-sm font-mono-data text-foreground">{evt.guestCount}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[8px] text-muted-foreground/50 uppercase tracking-wide mb-0.5">Projected</p>
                    <span className={`text-sm font-mono-data font-semibold ${cfg.text}`}>{evt.projectedUnits} units</span>
                  </div>
                  <div>
                    <p className="text-[8px] text-muted-foreground/50 uppercase tracking-wide mb-0.5">Buy Rate</p>
                    <span className="text-sm font-mono-data text-foreground">{(evt.expectedPurchaseRate * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <p className="text-[8px] text-muted-foreground/50 uppercase tracking-wide mb-0.5">Revenue</p>
                    <span className="text-sm font-mono-data text-emerald-400">${purchaseRevenue.toLocaleString()}</span>
                  </div>
                </div>

                {/* Peak week */}
                <div className="mt-3 p-2 rounded-lg bg-secondary/10 border border-border/20">
                  <p className="text-[9px] text-muted-foreground/50">Peak purchase wave</p>
                  <p className="text-[11px] font-mono-data text-foreground mt-0.5">{evt.peakWeek}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Bottom panels: Inventory + Demand Composition ─── */}
      <div className="grid grid-cols-3 gap-6">
        {/* Inventory Gap Alert / Status */}
        <div className={`col-span-2 rounded-2xl p-5 border ${reg.inventoryGap > 0
          ? "bg-destructive/[0.03] border-destructive/15"
          : "bg-emerald-500/[0.03] border-emerald-500/15"
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              reg.inventoryGap > 0 ? "bg-destructive/10" : "bg-emerald-500/10"
            }`}>
              {reg.inventoryGap > 0
                ? <AlertTriangle className="w-5 h-5 text-destructive" />
                : <Package className="w-5 h-5 text-emerald-400" />
              }
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className={`text-sm font-semibold ${reg.inventoryGap > 0 ? "text-destructive" : "text-emerald-400"}`}>
                  {reg.inventoryGap > 0 ? "Inventory Shortfall Projected" : "Stock Sufficient"}
                </p>
              </div>
              {reg.inventoryGap > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Registry demand will exhaust current stock — <span className="text-destructive font-semibold font-mono-data">{reg.inventoryGap} additional units</span> needed
                    to fulfill projected registry purchases without impacting organic demand.
                  </p>
                  {/* Visual gap bar */}
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-[9px] text-muted-foreground/40 mb-1">
                        <span>Current Stock</span>
                        <span>Total Projected Demand</span>
                      </div>
                      <div className="relative h-3 rounded-full bg-secondary/20 overflow-hidden">
                        <div className="absolute inset-y-0 left-0 bg-emerald-400/30 rounded-full"
                          style={{ width: `${Math.min(100, (brain.inventoryDecision.currentStock / (brain.inventoryDecision.currentStock + reg.inventoryGap)) * 100)}%` }} />
                        <div className="absolute inset-y-0 right-0 bg-destructive/20 rounded-r-full"
                          style={{ width: `${Math.min(100, (reg.inventoryGap / (brain.inventoryDecision.currentStock + reg.inventoryGap)) * 100)}%` }} />
                      </div>
                      <div className="flex justify-between text-[9px] font-mono-data mt-1">
                        <span className="text-emerald-400">{brain.inventoryDecision.currentStock} units</span>
                        <span className="text-destructive">+{reg.inventoryGap} needed</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Current inventory of <span className="text-emerald-400 font-semibold font-mono-data">{brain.inventoryDecision.currentStock} units</span> is
                  sufficient to cover both organic and registry demand over the next 8 weeks.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Event Type Breakdown */}
        <div className="rounded-2xl p-5 bg-card border border-border/60">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">Event Mix</p>
          </div>
          <div className="space-y-3">
            {eventBreakdown.map(([type, count]) => {
              const cfg = eventConfig[type] || eventConfig.birthday;
              const Icon = cfg.icon;
              const evtsOfType = reg.events.filter(e => e.eventType === type);
              const unitsOfType = evtsOfType.reduce((s, e) => s + e.projectedUnits, 0);
              const pctOfTotal = reg.totalProjectedRegistryUnits > 0
                ? (unitsOfType / reg.totalProjectedRegistryUnits * 100) : 0;

              return (
                <div key={type} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${cfg.text}`}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                    <span className="text-[11px] font-mono-data text-muted-foreground">{unitsOfType} units</span>
                  </div>
                  <div className="relative h-1.5 rounded-full bg-secondary/20 overflow-hidden">
                    <div className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700`}
                      style={{
                        width: `${pctOfTotal}%`,
                        background: type === "wedding" ? "hsl(38 92% 50%)"
                          : type === "baby" ? "hsl(265 60% 62%)"
                          : type === "housewarming" ? "hsl(152 69% 45%)"
                          : "hsl(199 89% 48%)",
                        opacity: 0.6,
                      }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-border/15 mt-4 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground/50">Total Registry Units</span>
              <span className="text-sm font-mono-data font-semibold text-foreground">{reg.totalProjectedRegistryUnits}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistryDemandView;
