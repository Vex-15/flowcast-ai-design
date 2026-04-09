import { useState, useMemo } from "react";
import {
  AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, ComposedChart, Bar,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { FlaskConical, DollarSign, AlertTriangle, Calendar, Undo2, TrendingUp, TrendingDown, ArrowUp, ArrowDown, ChevronDown, ChevronUp } from "lucide-react";
import type { SimulationParams, SimulationResult } from "@/data/types";

const SimulationPanel = ({
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
  const update = (partial: Partial<SimulationParams>) => {
    onParamsChange({ ...params, ...partial });
  };
  const [showPL, setShowPL] = useState(false);

  const pnl = result.profitLoss;

  return (
    <div className="space-y-5">
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">What-If Simulation Engine</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{skuName} — probabilistic modeling</p>
          </div>
        </div>

        {/* Controls */}
        <div className="grid md:grid-cols-2 gap-5 mb-6">
          {/* Demand Multiplier */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground font-medium">Demand Multiplier</label>
              <span className="text-lg font-bold text-foreground tabular-nums">{params.demandMultiplier.toFixed(1)}x</span>
            </div>
            <Slider
              value={[params.demandMultiplier * 100]}
              onValueChange={([v]) => update({ demandMultiplier: v / 100 })}
              min={50}
              max={300}
              step={10}
            />
            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
              <span>0.5x</span><span>3.0x</span>
            </div>
          </div>

          {/* Return Rate Adjustment */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground font-medium">Return Rate Adjustment</label>
              <span className="text-lg font-bold text-foreground tabular-nums">
                {params.returnRateAdj > 0 ? "+" : ""}{params.returnRateAdj}%
              </span>
            </div>
            <Slider
              value={[params.returnRateAdj + 50]}
              onValueChange={([v]) => update({ returnRateAdj: v - 50 })}
              min={0}
              max={100}
              step={5}
            />
            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
              <span>-50%</span><span>+50%</span>
            </div>
          </div>

          {/* Demand Fluctuation (NEW) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground font-medium">Demand Variance</label>
              <span className="text-lg font-bold text-foreground tabular-nums">{params.demandFluctuation || 15}%</span>
            </div>
            <Slider
              value={[params.demandFluctuation || 15]}
              onValueChange={([v]) => update({ demandFluctuation: v })}
              min={0}
              max={60}
              step={5}
            />
            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
              <span>Stable</span><span>Volatile</span>
            </div>
          </div>

          {/* Promotion Intensity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground font-medium">Promotion Intensity</label>
              <span className="text-lg font-bold text-foreground tabular-nums">{params.promotionIntensity}%</span>
            </div>
            <Slider
              value={[params.promotionIntensity]}
              onValueChange={([v]) => update({ promotionIntensity: v })}
              min={0}
              max={100}
              step={5}
            />
            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
              <span>None</span><span>Max</span>
            </div>
          </div>

          {/* Festival Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/20">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-xs font-medium text-foreground">Festival Mode</p>
                <p className="text-[10px] text-muted-foreground">Diwali, Christmas, Back-to-School</p>
              </div>
            </div>
            <Switch
              checked={params.festivalActive}
              onCheckedChange={(checked) => update({ festivalActive: checked })}
            />
          </div>

          {/* Seasonality (NEW) */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/20">
            <p className="text-xs font-medium text-foreground mb-2">Seasonality Mode</p>
            <div className="flex flex-wrap gap-1.5">
              {(["none", "spring", "summer", "holiday", "back-to-school"] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => update({ seasonalityMode: mode })}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                    (params.seasonalityMode || "none") === mode
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground/60 hover:text-foreground bg-secondary/30"
                  }`}
                >
                  {mode === "none" ? "None" : mode === "back-to-school" ? "BTS" : mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stockout Timeline */}
        <h4 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">Stockout Timeline</h4>
        <div className="h-[220px] w-full mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={result.stockoutTimeline} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(160 60% 45%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(160 60% 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 20% 16%)" />
              <XAxis
                dataKey="day"
                tick={{ fill: "hsl(220 15% 55%)", fontSize: 10 }}
                axisLine={{ stroke: "hsl(222 20% 16%)" }}
                tickLine={false}
                interval={2}
              />
              <YAxis tick={{ fill: "hsl(220 15% 55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(222 25% 10%)",
                  border: "1px solid hsl(222 20% 16%)",
                  borderRadius: "12px",
                  fontSize: "11px",
                  color: "hsl(220 20% 93%)",
                }}
              />
              <Area type="monotone" dataKey="stock" stroke="hsl(160 60% 45%)" strokeWidth={2} fill="url(#stockGrad)" dot={false} />
              <Line type="monotone" dataKey="demand" stroke="hsl(0 70% 55%)" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Impact Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl bg-secondary/30 border border-border/20 p-3">
            <DollarSign className="w-4 h-4 text-emerald-400 mb-1.5" />
            <p className="text-lg font-bold text-foreground tabular-nums">
              ${(pnl.grossRevenue / 1000).toFixed(0)}k
            </p>
            <p className="text-[10px] text-muted-foreground">Gross Revenue</p>
          </div>
          <div className="rounded-xl bg-secondary/30 border border-border/20 p-3">
            <Undo2 className="w-4 h-4 text-destructive mb-1.5" />
            <p className="text-lg font-bold text-destructive tabular-nums">
              -${(pnl.returnCost / 1000).toFixed(0)}k
            </p>
            <p className="text-[10px] text-muted-foreground">Return Cost</p>
          </div>
          <div className="rounded-xl bg-secondary/30 border border-border/20 p-3">
            <AlertTriangle className={`w-4 h-4 mb-1.5 ${result.stockoutDay ? "text-destructive" : "text-emerald-400"}`} />
            <p className={`text-lg font-bold tabular-nums ${result.stockoutDay ? "text-destructive" : "text-emerald-400"}`}>
              {result.stockoutDay ? `Day ${result.stockoutDay}` : "None"}
            </p>
            <p className="text-[10px] text-muted-foreground">Stockout Day</p>
          </div>
          <div className="rounded-xl bg-secondary/30 border border-border/20 p-3">
            {pnl.profitDelta >= 0 ? <ArrowUp className="w-4 h-4 text-emerald-400 mb-1.5" /> : <ArrowDown className="w-4 h-4 text-destructive mb-1.5" />}
            <p className={`text-lg font-bold tabular-nums ${pnl.profitDelta >= 0 ? "text-emerald-400" : "text-destructive"}`}>
              {pnl.profitDelta >= 0 ? "+" : ""}${(pnl.profitDelta / 1000).toFixed(0)}k
            </p>
            <p className="text-[10px] text-muted-foreground">P/L vs Baseline</p>
          </div>
        </div>
      </div>

      {/* Store Impact */}
      <div className="glass rounded-2xl p-5">
        <h4 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">Store-Level Impact</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {result.storeImpacts.map((store) => {
            const color = store.status === "Critical"
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : store.status === "Low"
              ? "border-amber-500/20 bg-amber-500/5 text-amber-400"
              : "border-emerald-500/20 bg-emerald-500/5 text-emerald-400";
            return (
              <div key={store.store} className={`rounded-xl border p-3 ${color}`}>
                <p className="text-xs font-medium text-foreground truncate">{store.store}</p>
                <p className="text-sm font-bold tabular-nums">{store.status}</p>
                <p className="text-[10px] text-muted-foreground">{store.daysSupply} days supply</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SimulationPanel;
