import { useState } from "react";
import {
  AreaChart, Area, Line, XAxis, YAxis, ComposedChart, Bar,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend, CartesianGrid,
} from "recharts";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  DollarSign, AlertTriangle, TrendingUp, TrendingDown,
  ArrowDown, ArrowUp, ChevronDown, ChevronUp, Undo2, FlaskConical,
} from "lucide-react";
import type { SimulationParams, SimulationResult } from "@/data/types";

const SimulationView = ({
  params,
  onParamsChange,
  result,
  skuName,
}: {
  params: SimulationParams;
  onParamsChange: (p: SimulationParams) => void;
  result: SimulationResult;
  skuName: string;
}) => {
  const update = (partial: Partial<SimulationParams>) => onParamsChange({ ...params, ...partial });
  const [showPLDetails, setShowPLDetails] = useState(false);
  const [activeChart, setActiveChart] = useState<"stockout" | "forecast" | "confidence">("stockout");

  const pnl = result.profitLoss;
  const retImpact = result.returnImpact;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ─── Header ─── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-foreground">
            Simulation <span className="font-semibold">Lab</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{skuName} — probabilistic what-if engine</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
          <FlaskConical className="w-3.5 h-3.5 text-accent" />
          <span className="text-[10px] font-semibold text-accent tracking-widest uppercase">Monte Carlo Configured</span>
        </div>
      </div>

      {/* ─── Profit/Loss Summary Strip ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-border/20 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-card p-4">
          <DollarSign className="w-4 h-4 text-emerald-400/40 mb-2" />
          <p className="text-2xl font-light font-mono-data text-foreground tracking-tight">
            ${(pnl.grossRevenue / 1000).toFixed(0)}k
          </p>
          <p className="label-micro text-[8px] mt-1">GROSS REVENUE</p>
        </div>
        {/* We can hide Return Cost if the focus is purely supply chain, but leaving it to prevent breakage */}
        <div className="bg-card p-4 flex flex-col justify-between">
          <div>
            <Undo2 className="w-4 h-4 text-destructive/40 mb-2" />
            <p className="text-2xl font-light font-mono-data text-destructive tracking-tight">
              -${(pnl.returnCost / 1000).toFixed(0)}k
            </p>
            <p className="label-micro text-[8px] mt-1">RETURN COST</p>
          </div>
        </div>
        <div className="bg-card p-4">
          <AlertTriangle className={`w-4 h-4 mb-2 ${result.stockoutDay ? "text-destructive" : "text-emerald-400"}`} />
          <p className={`text-2xl font-light font-mono-data tracking-tight ${result.stockoutDay ? "text-destructive" : "text-emerald-400"}`}>
            {result.stockoutDay ? `Day ${result.stockoutDay}` : "None"}
          </p>
          <p className="label-micro text-[8px] mt-1">STOCKOUT</p>
        </div>
        <div className="bg-card p-4">
          <TrendingUp className="w-4 h-4 text-muted-foreground/30 mb-2" />
          <p className={`text-2xl font-light font-mono-data tracking-tight ${pnl.netProfit >= 0 ? "text-emerald-400" : "text-destructive"}`}>
            ${(pnl.netProfit / 1000).toFixed(0)}k
          </p>
          <p className="label-micro text-[8px] mt-1">NET PROFIT</p>
        </div>
        <div className="bg-card p-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none" />
          <div className="flex items-center gap-1 mb-1">
            {pnl.profitDelta >= 0 ? (
              <ArrowUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <ArrowDown className="w-4 h-4 text-destructive" />
            )}
          </div>
          <p className={`text-2xl font-semibold font-mono-data tracking-tight ${pnl.profitDelta >= 0 ? "text-emerald-400" : "text-destructive"}`}>
            {pnl.profitDelta >= 0 ? "+" : ""}${(pnl.profitDelta / 1000).toFixed(0)}k
          </p>
          <p className="label-micro text-[8px] mt-1">P/L vs BASELINE</p>
        </div>
      </div>

      {/* ─── Expandable P/L Details ─── */}
      <div className="group">
        <button
          onClick={() => setShowPLDetails(!showPLDetails)}
          className="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-secondary/20 transition-colors"
        >
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Detailed P/L Breakdown</span>
          {showPLDetails ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/40" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40" />}
        </button>
        {showPLDetails && (
          <div className="p-4 rounded-xl bg-card border border-border/15 mt-2 animate-slide-up" style={{ animationDuration: "200ms" }}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/10">
                <span className="text-[11px] text-muted-foreground">Gross Revenue</span>
                <span className="text-[11px] font-mono-data text-emerald-400 font-medium">${(pnl.grossRevenue / 1000).toFixed(1)}k</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/10">
                <span className="text-[11px] text-muted-foreground">Return Cost</span>
                <span className="text-[11px] font-mono-data text-destructive font-medium">-${(pnl.returnCost / 1000).toFixed(1)}k</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/10">
                <span className="text-[11px] text-muted-foreground">Holding Cost</span>
                <span className="text-[11px] font-mono-data text-amber-400 font-medium">-${(pnl.holdingCost / 1000).toFixed(1)}k</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/10">
                <span className="text-[11px] text-muted-foreground">Stockout Loss</span>
                <span className="text-[11px] font-mono-data text-destructive font-medium">-${(pnl.stockoutLoss / 1000).toFixed(1)}k</span>
              </div>
            </div>
            {/* Return Impact mini-strip */}
            <div className="flex items-center gap-6 px-4 py-3 rounded-lg overflow-hidden bg-background/50 border border-border/10">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase">Returns Impact</span>
              <div className="flex gap-6 flex-1 justify-end">
                <div className="flex items-baseline gap-2">
                  <span className="text-[9px] text-muted-foreground/50">Total:</span>
                  <span className="text-sm font-mono-data font-light text-foreground">{retImpact.totalReturns} units</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[9px] text-muted-foreground/50">Rate:</span>
                  <span className="text-sm font-mono-data font-light text-amber-400">{(retImpact.effectiveReturnRate * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Main Content Layout (1/3 Controls, 2/3 Chart) ─── */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Controls */}
        <div className="lg:col-span-1 border border-border/20 bg-card rounded-2xl p-5 shadow-sm space-y-6 flex flex-col">
          <div className="pb-4 border-b border-border/20">
            <h2 className="text-sm font-semibold text-foreground">Parameters</h2>
            <p className="text-[10px] text-muted-foreground">Adjust variables to run the simulation.</p>
          </div>

          <div className="space-y-6 flex-1">
            {/* Demand Multiplier */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="label-micro text-[9px]">DEMAND MULTIPLIER</span>
                <span className="text-sm font-mono-data font-medium text-foreground">{params.demandMultiplier.toFixed(1)}x</span>
              </div>
              <Slider
                value={[params.demandMultiplier * 100]}
                onValueChange={([v]) => update({ demandMultiplier: v / 100 })}
                min={50} max={300} step={10}
                className="py-1"
              />
            </div>

            {/* Demand Variance */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="label-micro text-[9px]">DEMAND VOLATILITY</span>
                <span className={`text-sm font-mono-data font-medium ${params.demandFluctuation && params.demandFluctuation > 25 ? 'text-amber-400' : 'text-foreground'}`}>
                  {params.demandFluctuation || 15}%
                </span>
              </div>
              <Slider
                value={[params.demandFluctuation || 15]}
                onValueChange={([v]) => update({ demandFluctuation: v })}
                min={0} max={60} step={5}
                className="py-1"
              />
            </div>

            {/* Market Trend */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="label-micro text-[9px]">MACRO MARKET TREND</span>
                <span className={`text-sm font-mono-data font-medium ${(params.externalTrendFactor || 0) > 0 ? "text-emerald-400" : (params.externalTrendFactor || 0) < 0 ? "text-destructive" : "text-foreground"}`}>
                  {(params.externalTrendFactor || 0) > 0 ? "+" : ""}{params.externalTrendFactor || 0}%
                </span>
              </div>
              <Slider
                value={[(params.externalTrendFactor || 0) + 50]}
                onValueChange={([v]) => update({ externalTrendFactor: v - 50 })}
                min={0} max={100} step={5}
                className="py-1"
              />
            </div>

            {/* Promo Intensity */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="label-micro text-[9px]">PROMO INTENSITY</span>
                <span className="text-sm font-mono-data font-medium text-foreground">{params.promotionIntensity}%</span>
              </div>
              <Slider
                value={[params.promotionIntensity]}
                onValueChange={([v]) => update({ promotionIntensity: v })}
                min={0} max={100} step={5}
                className="py-1"
              />
            </div>

            {/* Return Rate Adj */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="label-micro text-[9px]">RETURNS SHIFT</span>
                <span className={`text-sm font-mono-data font-medium ${params.returnRateAdj > 0 ? "text-destructive" : params.returnRateAdj < 0 ? "text-emerald-400" : "text-foreground"}`}>
                  {params.returnRateAdj > 0 ? "+" : ""}{params.returnRateAdj}%
                </span>
              </div>
              <Slider
                value={[params.returnRateAdj + 50]}
                onValueChange={([v]) => update({ returnRateAdj: v - 50 })}
                min={0} max={100} step={5}
                className="py-1"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border/20 space-y-5">
            {/* Contextual Mode Toggles */}
            <div>
              <span className="label-micro text-[9px] mb-2 block">SEASONALITY OVERRIDE</span>
              <div className="flex flex-wrap gap-1.5">
                {(["none", "spring", "summer", "holiday"] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => update({ seasonalityMode: mode })}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                      (params.seasonalityMode || "none") === mode
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {mode === "none" ? "None" : mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/10 border border-border/10">
              <div>
                <p className="text-xs font-medium text-foreground">Festival Mode</p>
                <p className="text-[9px] text-muted-foreground/60 mt-0.5">Activate holiday multiplier</p>
              </div>
              <Switch
                checked={params.festivalActive}
                onCheckedChange={(checked) => update({ festivalActive: checked })}
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Chart and Impacts */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Chart Card */}
          <div className="border border-border/20 bg-card rounded-2xl p-5 shadow-sm">
            {/* Chart Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-secondary/30">
                {([
                  { key: "stockout", label: "Stock Timeline" },
                  { key: "forecast", label: "Forecast Delta" },
                  { key: "confidence", label: "Confidence Band" },
                ] as const).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveChart(tab.key)}
                    className={`px-4 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      activeChart === tab.key
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground/70 hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {activeChart === "stockout" && result.stockoutDay && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-destructive/20 bg-destructive/10">
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                  <span className="text-[10px] uppercase font-semibold text-destructive tracking-wider">
                    Stockout Day {result.stockoutDay}
                  </span>
                </div>
              )}
            </div>

            {/* Recharts Container */}
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {activeChart === "stockout" ? (
                  <AreaChart data={result.stockoutTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="stockGradSim" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(152 69% 45%)" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="hsl(152 69% 45%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(220 10% 40%)" }} axisLine={false} tickLine={false} interval={3} dy={8} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(220 10% 40%)" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", fontSize: "11px", color: "hsl(var(--foreground))", boxShadow: "0 8px 32px -8px rgba(0,0,0,0.15)" }}
                    />
                    {result.stockoutDay && (
                      <ReferenceLine x={`Day ${result.stockoutDay}`} stroke="hsl(0 72% 51%)" strokeWidth={1} strokeDasharray="4 4" />
                    )}
                    <Area type="monotone" dataKey="stock" stroke="hsl(152 69% 45%)" strokeWidth={2.5} fill="url(#stockGradSim)" dot={false} name="Stock Level" />
                    <Line type="monotone" dataKey="demand" stroke="hsl(0 72% 51% / 0.8)" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Daily Demand" />
                  </AreaChart>
                ) : activeChart === "forecast" ? (
                  <ComposedChart data={result.forecastComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(220 10% 40%)" }} axisLine={false} tickLine={false} interval={3} dy={8} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(220 10% 40%)" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", fontSize: "11px", color: "hsl(var(--foreground))", boxShadow: "0 8px 32px -8px rgba(0,0,0,0.15)" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} iconSize={10} />
                    <Bar dataKey="baseline" fill="hsl(217 91% 60% / 0.15)" radius={[3, 3, 0, 0]} name="Baseline Forecast" />
                    <Line type="monotone" dataKey="simulated" stroke="hsl(280 80% 75%)" strokeWidth={2.5} dot={false} name="Simulated Demand" />
                    <Line type="monotone" dataKey="returnAdjusted" stroke="hsl(152 69% 45%)" strokeWidth={2} strokeDasharray="3 3" dot={false} name="Net (After Returns)" />
                  </ComposedChart>
                ) : (
                  <AreaChart data={result.confidenceInterval.map(d => ({ ...d, confidence: [d.lower, d.upper] }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(220 10% 40%)" }} axisLine={false} tickLine={false} interval={3} dy={8} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(220 10% 40%)" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", fontSize: "11px", color: "hsl(var(--foreground))", boxShadow: "0 8px 32px -8px rgba(0,0,0,0.15)" }}
                    />
                    <Area type="monotone" dataKey="confidence" stroke="none" fill="#9333ea" fillOpacity={0.15} name="95% CI Range" />
                    <Line type="monotone" dataKey="mean" stroke="hsl(217 91% 60%)" strokeWidth={3} dot={false} name="Expected Forecast" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
            
            {/* Chart specific legends */}
            {activeChart === "confidence" && (
              <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border/10">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-[3px] bg-primary rounded-full" />
                  <span className="text-[11px] text-muted-foreground font-medium">Mean Forecast</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-[14px] rounded-md bg-[#9333ea]/15" />
                  <span className="text-[11px] text-muted-foreground font-medium">95% Confidence Band</span>
                </div>
              </div>
            )}
            {activeChart === "stockout" && (
              <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border/10">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-[8px] rounded-sm bg-emerald-500/25 border border-emerald-500/50" />
                  <span className="text-[11px] text-muted-foreground font-medium">Live Stock Level</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-0 border-t-2 border-dashed border-destructive/50" />
                  <span className="text-[11px] text-muted-foreground font-medium">Daily Demand Rate</span>
                </div>
              </div>
            )}
          </div>

          {/* Store Impacts Summary Strip */}
          <div className="bg-card border border-border/20 rounded-2xl p-4 shadow-sm">
            <h3 className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-3">Store Pipeline Impacts</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {result.storeImpacts.map((store) => {
                const isCritical = store.status === "Critical";
                const color = isCritical ? "text-destructive" : store.status === "Low" ? "text-amber-400" : "text-emerald-400";
                const bg = isCritical ? "bg-destructive/[0.04] border-destructive/20" : store.status === "Low" ? "bg-amber-500/[0.03] border-amber-500/10" : "bg-emerald-500/[0.03] border-emerald-500/10";
                return (
                  <div key={store.store} className={`rounded-xl p-3 border ${bg} transition-colors flex flex-col`}>
                    <p className="text-[11px] font-medium text-foreground/80 truncate mb-1">{store.store}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <p className={`text-sm font-mono-data font-bold ${color}`}>{store.status}</p>
                      <p className="text-[10px] font-medium text-muted-foreground/60">{store.daysSupply}d left</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SimulationView;
