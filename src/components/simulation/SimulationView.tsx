import { useState } from "react";
import {
  AreaChart, Area, Line, XAxis, YAxis, ComposedChart, Bar,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend, CartesianGrid,
} from "recharts";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  DollarSign, AlertTriangle, Calendar, TrendingUp, TrendingDown,
  ArrowDown, ArrowUp, BarChart3, ChevronDown, ChevronUp, Undo2, FlaskConical,
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
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-accent/60" />
          <span className="text-[10px] text-muted-foreground/60">Monte Carlo Simulation</span>
        </div>
      </div>

      {/* ─── Enhanced Control Panel ─── */}
      <div className="p-5 rounded-2xl bg-card border border-border/20">
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-5">
          {/* Demand Multiplier */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="label-micro text-[9px]">DEMAND</span>
              <span className="text-lg font-mono-data font-light text-foreground">{params.demandMultiplier.toFixed(1)}x</span>
            </div>
            <Slider
              value={[params.demandMultiplier * 100]}
              onValueChange={([v]) => update({ demandMultiplier: v / 100 })}
              min={50} max={300} step={10}
            />
            <div className="flex justify-between mt-1 text-[9px] text-muted-foreground/30">
              <span>0.5x</span><span>3.0x</span>
            </div>
          </div>

          {/* Return Rate */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="label-micro text-[9px]">RETURNS</span>
              <span className={`text-lg font-mono-data font-light ${params.returnRateAdj > 0 ? "text-destructive" : params.returnRateAdj < 0 ? "text-emerald-400" : "text-foreground"}`}>
                {params.returnRateAdj > 0 ? "+" : ""}{params.returnRateAdj}%
              </span>
            </div>
            <Slider
              value={[params.returnRateAdj + 50]}
              onValueChange={([v]) => update({ returnRateAdj: v - 50 })}
              min={0} max={100} step={5}
            />
            <div className="flex justify-between mt-1 text-[9px] text-muted-foreground/30">
              <span>-50%</span><span>+50%</span>
            </div>
          </div>

          {/* Demand Fluctuation (NEW) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="label-micro text-[9px]">VARIANCE</span>
              <span className="text-lg font-mono-data font-light text-foreground">{params.demandFluctuation || 15}%</span>
            </div>
            <Slider
              value={[params.demandFluctuation || 15]}
              onValueChange={([v]) => update({ demandFluctuation: v })}
              min={0} max={60} step={5}
            />
            <div className="flex justify-between mt-1 text-[9px] text-muted-foreground/30">
              <span>Stable</span><span>Volatile</span>
            </div>
          </div>

          {/* Promotion */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="label-micro text-[9px]">PROMO</span>
              <span className="text-lg font-mono-data font-light text-foreground">{params.promotionIntensity}%</span>
            </div>
            <Slider
              value={[params.promotionIntensity]}
              onValueChange={([v]) => update({ promotionIntensity: v })}
              min={0} max={100} step={5}
            />
            <div className="flex justify-between mt-1 text-[9px] text-muted-foreground/30">
              <span>None</span><span>Max</span>
            </div>
          </div>
        </div>

        {/* Second row: Seasonality + External Trend + Festival */}
        <div className="grid md:grid-cols-3 gap-5 mt-5 pt-5 border-t border-border/10">
          {/* Seasonality Mode (NEW) */}
          <div>
            <span className="label-micro text-[9px]">SEASONALITY</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(["none", "spring", "summer", "holiday", "back-to-school"] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => update({ seasonalityMode: mode })}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                    (params.seasonalityMode || "none") === mode
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "text-muted-foreground/60 hover:text-foreground bg-secondary/20 border border-transparent"
                  }`}
                >
                  {mode === "none" ? "None" : mode === "back-to-school" ? "Back to School" : mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* External Trend Factor (NEW) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="label-micro text-[9px]">MARKET TREND</span>
              <span className={`text-lg font-mono-data font-light ${(params.externalTrendFactor || 0) > 0 ? "text-emerald-400" : (params.externalTrendFactor || 0) < 0 ? "text-destructive" : "text-foreground"}`}>
                {(params.externalTrendFactor || 0) > 0 ? "+" : ""}{params.externalTrendFactor || 0}%
              </span>
            </div>
            <Slider
              value={[(params.externalTrendFactor || 0) + 50]}
              onValueChange={([v]) => update({ externalTrendFactor: v - 50 })}
              min={0} max={100} step={5}
            />
            <div className="flex justify-between mt-1 text-[9px] text-muted-foreground/30">
              <span>Bearish -50%</span><span>Bullish +50%</span>
            </div>
          </div>

          {/* Festival toggle */}
          <div className="flex flex-col justify-between">
            <span className="label-micro text-[9px]">FESTIVAL</span>
            <div className="flex items-center justify-between mt-2">
              <div>
                <p className="text-xs text-foreground/80">Festival Mode</p>
                <p className="text-[9px] text-muted-foreground/40 mt-0.5">Diwali / Christmas</p>
              </div>
              <Switch
                checked={params.festivalActive}
                onCheckedChange={(checked) => update({ festivalActive: checked })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Profit/Loss Summary Strip ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-px bg-border/20 rounded-2xl overflow-hidden">
        <div className="bg-card p-4">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400/40 mb-2" />
          <p className="text-xl font-light font-mono-data text-foreground tracking-tight">
            ${(pnl.grossRevenue / 1000).toFixed(0)}k
          </p>
          <p className="label-micro text-[8px] mt-1">GROSS REVENUE</p>
        </div>
        <div className="bg-card p-4">
          <Undo2 className="w-3.5 h-3.5 text-destructive/40 mb-2" />
          <p className="text-xl font-light font-mono-data text-destructive tracking-tight">
            -${(pnl.returnCost / 1000).toFixed(0)}k
          </p>
          <p className="label-micro text-[8px] mt-1">RETURN COST</p>
        </div>
        <div className="bg-card p-4">
          <AlertTriangle className={`w-3.5 h-3.5 mb-2 ${result.stockoutDay ? "text-destructive/40" : "text-emerald-400/40"}`} />
          <p className={`text-xl font-light font-mono-data tracking-tight ${result.stockoutDay ? "text-destructive" : "text-emerald-400"}`}>
            {result.stockoutDay ? `Day ${result.stockoutDay}` : "None"}
          </p>
          <p className="label-micro text-[8px] mt-1">STOCKOUT</p>
        </div>
        <div className="bg-card p-4">
          <TrendingUp className="w-3.5 h-3.5 text-muted-foreground/30 mb-2" />
          <p className={`text-xl font-light font-mono-data tracking-tight ${pnl.netProfit >= 0 ? "text-emerald-400" : "text-destructive"}`}>
            ${(pnl.netProfit / 1000).toFixed(0)}k
          </p>
          <p className="label-micro text-[8px] mt-1">NET PROFIT</p>
        </div>
        <div className="bg-card p-4">
          <div className="flex items-center gap-1 mb-2">
            {pnl.profitDelta >= 0 ? (
              <ArrowUp className="w-3.5 h-3.5 text-emerald-400/40" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-destructive/40" />
            )}
          </div>
          <p className={`text-xl font-light font-mono-data tracking-tight ${pnl.profitDelta >= 0 ? "text-emerald-400" : "text-destructive"}`}>
            {pnl.profitDelta >= 0 ? "+" : ""}${(pnl.profitDelta / 1000).toFixed(0)}k
          </p>
          <p className="label-micro text-[8px] mt-1">P/L vs BASELINE</p>
        </div>
      </div>

      {/* ─── Expandable P/L Details ─── */}
      <button
        onClick={() => setShowPLDetails(!showPLDetails)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-secondary/20 border border-border/10 hover:bg-secondary/30 transition-colors"
      >
        <span className="text-xs text-muted-foreground font-medium">Detailed P/L Breakdown</span>
        {showPLDetails ? <ChevronUp className="w-4 h-4 text-muted-foreground/40" /> : <ChevronDown className="w-4 h-4 text-muted-foreground/40" />}
      </button>
      
      {showPLDetails && (
        <div className="p-4 rounded-xl bg-secondary/10 border border-border/10 space-y-2 animate-slide-up" style={{ animationDuration: "200ms" }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-card">
              <span className="text-[11px] text-muted-foreground">Gross Revenue</span>
              <span className="text-[11px] font-mono-data text-emerald-400 font-medium">${(pnl.grossRevenue / 1000).toFixed(1)}k</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-card">
              <span className="text-[11px] text-muted-foreground">Return Cost</span>
              <span className="text-[11px] font-mono-data text-destructive font-medium">-${(pnl.returnCost / 1000).toFixed(1)}k</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-card">
              <span className="text-[11px] text-muted-foreground">Holding Cost</span>
              <span className="text-[11px] font-mono-data text-amber-400 font-medium">-${(pnl.holdingCost / 1000).toFixed(1)}k</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-card">
              <span className="text-[11px] text-muted-foreground">Stockout Loss</span>
              <span className="text-[11px] font-mono-data text-destructive font-medium">-${(pnl.stockoutLoss / 1000).toFixed(1)}k</span>
            </div>
          </div>
          <div className="flex items-center justify-between px-3 py-3 rounded-lg bg-gradient-to-r from-primary/[0.04] to-accent/[0.04] border border-primary/10 mt-3">
            <span className="text-xs text-foreground font-semibold">Net Profit Margin</span>
            <span className={`text-sm font-mono-data font-bold ${pnl.margin >= 0 ? "text-emerald-400" : "text-destructive"}`}>
              {pnl.margin}%
            </span>
          </div>
          
          {/* Return Impact */}
          <div className="mt-4 pt-3 border-t border-border/10">
            <p className="label-micro text-[9px] mb-2">RETURN IMPACT ANALYSIS</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-lg bg-card text-center">
                <p className="text-lg font-mono-data font-light text-destructive">{retImpact.totalReturns}</p>
                <p className="text-[9px] text-muted-foreground/50">Total Returns</p>
              </div>
              <div className="p-2.5 rounded-lg bg-card text-center">
                <p className="text-lg font-mono-data font-light text-amber-400">{(retImpact.effectiveReturnRate * 100).toFixed(1)}%</p>
                <p className="text-[9px] text-muted-foreground/50">Effective Rate</p>
              </div>
              <div className="p-2.5 rounded-lg bg-card text-center">
                <p className="text-lg font-mono-data font-light text-destructive">${(retImpact.returnCostDollars / 1000).toFixed(1)}k</p>
                <p className="text-[9px] text-muted-foreground/50">Cost</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Chart Tab Selector ─── */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/20 w-fit">
        {([
          { key: "stockout", label: "Stockout Timeline" },
          { key: "forecast", label: "Forecast vs Actual" },
          { key: "confidence", label: "Confidence Band" },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveChart(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
              activeChart === tab.key
                ? "bg-primary/15 text-primary shadow-sm"
                : "text-muted-foreground/60 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Charts ─── */}
      <div className="relative -mx-6">
        <div className="px-6 mb-2 flex items-center justify-between">
          <p className="label-micro text-[9px]">
            {activeChart === "stockout" ? "STOCKOUT TIMELINE" : activeChart === "forecast" ? "FORECAST COMPARISON" : "CONFIDENCE INTERVAL"}
          </p>
          {activeChart === "stockout" && result.stockoutDay && (
            <span className="text-[10px] font-mono-data text-destructive font-medium">
              ⚠ Stockout on Day {result.stockoutDay}
            </span>
          )}
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeChart === "stockout" ? (
              <AreaChart data={result.stockoutTimeline} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="stockGradSim" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(152 69% 45%)" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="hsl(152 69% 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 12% 14%)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: "hsl(220 10% 36%)" }} axisLine={false} tickLine={false} interval={3} dy={5} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(220 10% 36%)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(225 15% 9%)",
                    border: "1px solid hsl(225 12% 16%)",
                    borderRadius: "10px",
                    fontSize: "11px",
                    boxShadow: "0 8px 32px -8px rgba(0,0,0,0.5)",
                  }}
                />
                {result.stockoutDay && (
                  <ReferenceLine x={`Day ${result.stockoutDay}`} stroke="hsl(0 72% 51%)" strokeWidth={1} strokeDasharray="4 4" />
                )}
                <Area type="monotone" dataKey="stock" stroke="hsl(152 69% 45%)" strokeWidth={2} fill="url(#stockGradSim)" dot={false} name="Stock Level" />
                <Line type="monotone" dataKey="demand" stroke="hsl(0 72% 51% / 0.5)" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Daily Demand" />
              </AreaChart>
            ) : activeChart === "forecast" ? (
              <ComposedChart data={result.forecastComparison} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 12% 14%)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: "hsl(220 10% 36%)" }} axisLine={false} tickLine={false} interval={3} dy={5} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(220 10% 36%)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(225 15% 9%)",
                    border: "1px solid hsl(225 12% 16%)",
                    borderRadius: "10px",
                    fontSize: "11px",
                    boxShadow: "0 8px 32px -8px rgba(0,0,0,0.5)",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "10px" }}
                  iconSize={8}
                />
                <Bar dataKey="baseline" fill="hsl(217 91% 60% / 0.15)" radius={[3, 3, 0, 0]} name="Baseline" />
                <Line type="monotone" dataKey="simulated" stroke="hsl(265 60% 62%)" strokeWidth={2} dot={false} name="Simulated" />
                <Line type="monotone" dataKey="returnAdjusted" stroke="hsl(152 69% 45%)" strokeWidth={2} dot={false} name="Return-Adjusted" />
              </ComposedChart>
            ) : (
              <AreaChart data={result.confidenceInterval} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(265 60% 62%)" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="hsl(265 60% 62%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 12% 14%)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: "hsl(220 10% 36%)" }} axisLine={false} tickLine={false} interval={3} dy={5} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(220 10% 36%)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(225 15% 9%)",
                    border: "1px solid hsl(225 12% 16%)",
                    borderRadius: "10px",
                    fontSize: "11px",
                    boxShadow: "0 8px 32px -8px rgba(0,0,0,0.5)",
                  }}
                />
                <Area type="monotone" dataKey="upper" stroke="none" fill="url(#confGrad)" name="Upper 95% CI" />
                <Area type="monotone" dataKey="lower" stroke="none" fill="transparent" name="Lower 95% CI" />
                <Line type="monotone" dataKey="mean" stroke="hsl(217 91% 60%)" strokeWidth={2} dot={false} name="Mean Forecast" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
        {/* Chart legend for confidence */}
        {activeChart === "confidence" && (
          <div className="px-6 flex items-center gap-5 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-[2px] bg-primary rounded-full" />
              <span className="text-[10px] text-muted-foreground">Mean Forecast</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-3 rounded-sm bg-purple-500/10" />
              <span className="text-[10px] text-muted-foreground">95% Confidence Band</span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Store Impacts ─── */}
      <div className="grid grid-cols-4 gap-2">
        {result.storeImpacts.map((store) => {
          const color = store.status === "Critical" ? "text-destructive" : store.status === "Low" ? "text-amber-400" : "text-emerald-400";
          const bg = store.status === "Critical" ? "bg-destructive/[0.04]" : store.status === "Low" ? "bg-amber-500/[0.03]" : "bg-emerald-500/[0.03]";
          return (
            <div key={store.store} className={`rounded-lg p-3 ${bg} border border-border/10`}>
              <p className="text-[11px] text-foreground/70 truncate">{store.store}</p>
              <p className={`text-sm font-mono-data font-medium ${color}`}>{store.status}</p>
              <p className="text-[9px] text-muted-foreground/40">{store.daysSupply}d</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SimulationView;
