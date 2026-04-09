import {
  AreaChart, Area, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { DollarSign, AlertTriangle, Calendar } from "lucide-react";
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

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ─── Header ─── */}
      <div>
        <h1 className="text-2xl font-light tracking-tight text-foreground">
          Simulation <span className="font-semibold">Lab</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">{skuName} — adjust parameters, observe impact</p>
      </div>

      {/* ─── Control Panel ─── */}
      <div className="grid md:grid-cols-4 gap-4 p-5 rounded-2xl bg-card border border-border/20">
        {/* Demand */}
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

      {/* ─── Stockout Timeline ─── */}
      <div className="relative -mx-6">
        <div className="px-6 mb-2 flex items-center justify-between">
          <p className="label-micro text-[9px]">STOCKOUT TIMELINE</p>
          {result.stockoutDay && (
            <span className="text-[10px] font-mono-data text-destructive font-medium">
              ⚠ Stockout on Day {result.stockoutDay}
            </span>
          )}
        </div>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={result.stockoutTimeline} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="stockGradSim" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(152 69% 45%)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(152 69% 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tick={{ fontSize: 9, fill: "hsl(220 10% 36%)" }}
                axisLine={false}
                tickLine={false}
                interval={3}
                dy={5}
              />
              <YAxis hide />
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
                <ReferenceLine
                  x={`Day ${result.stockoutDay}`}
                  stroke="hsl(0 72% 51%)"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              )}
              <Area
                type="monotone"
                dataKey="stock"
                stroke="hsl(152 69% 45%)"
                strokeWidth={2}
                fill="url(#stockGradSim)"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="demand"
                stroke="hsl(0 72% 51% / 0.4)"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Impact Metrics ─── */}
      <div className="grid grid-cols-4 gap-px bg-border/20 rounded-xl overflow-hidden">
        <div className="bg-card p-4">
          <DollarSign className="w-3.5 h-3.5 text-muted-foreground/30 mb-2" />
          <p className="text-xl font-light font-mono-data text-foreground tracking-tight">
            ${(result.revenueImpact / 1000).toFixed(0)}k
          </p>
          <p className="label-micro text-[8px] mt-1">PROJECTED REV.</p>
        </div>
        <div className="bg-card p-4">
          <DollarSign className="w-3.5 h-3.5 text-muted-foreground/30 mb-2" />
          <p className={`text-xl font-light font-mono-data tracking-tight ${
            result.revenueDelta >= 0 ? "text-emerald-400" : "text-destructive"
          }`}>
            {result.revenueDelta >= 0 ? "+" : ""}${(result.revenueDelta / 1000).toFixed(0)}k
          </p>
          <p className="label-micro text-[8px] mt-1">DELTA</p>
        </div>
        <div className="bg-card p-4">
          <AlertTriangle className={`w-3.5 h-3.5 mb-2 ${result.stockoutDay ? "text-destructive/40" : "text-emerald-400/40"}`} />
          <p className={`text-xl font-light font-mono-data tracking-tight ${result.stockoutDay ? "text-destructive" : "text-emerald-400"}`}>
            {result.stockoutDay ? `Day ${result.stockoutDay}` : "None"}
          </p>
          <p className="label-micro text-[8px] mt-1">STOCKOUT</p>
        </div>
        <div className="bg-card p-4">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground/30 mb-2" />
          <p className="text-xl font-light font-mono-data text-foreground tracking-tight">21</p>
          <p className="label-micro text-[8px] mt-1">SIM DAYS</p>
        </div>
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
