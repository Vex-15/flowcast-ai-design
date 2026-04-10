import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import type { DemandDecomposition } from "@/data/types";
import { Eye, EyeOff, Layers, Info } from "lucide-react";

// ─── Layer configuration ────────────────────────────────────
const LAYERS = [
  { key: "base",            label: "Base Demand",     color: "hsl(217, 91%, 60%)",  gradientId: "baseGrad",     activeColor: "bg-primary/20 text-primary" },
  { key: "festivalBoost",   label: "Seasonal Effect",  color: "hsl(38, 92%, 55%)",   gradientId: "festGrad",     activeColor: "bg-amber-500/15 text-amber-400" },
  { key: "promotionBoost",  label: "Promotion Effect", color: "hsl(152, 69%, 45%)",  gradientId: "promoGrad",    activeColor: "bg-emerald-500/15 text-emerald-400" },
  { key: "weatherImpact",   label: "External Factors", color: "hsl(200, 80%, 55%)",  gradientId: "weatherGrad",  activeColor: "bg-cyan-500/15 text-cyan-400" },
] as const;

// ─── Custom Tooltip ─────────────────────────────────────────
const DecompTooltip = ({ active, payload, label, visibleLayers }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  const total = data.total;

  return (
    <div className="bg-card/95 backdrop-blur-xl border border-border/40 rounded-xl px-4 py-3 shadow-2xl min-w-[200px]">
      <p className="text-xs font-semibold text-foreground mb-2">{label}</p>
      <div className="space-y-1.5">
        {LAYERS.filter(l => visibleLayers[l.key]).map(layer => {
          const val = data[layer.key];
          const pct = total > 0 ? ((Math.abs(val) / total) * 100).toFixed(1) : "0";
          return (
            <div key={layer.key} className="flex items-center justify-between gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: layer.color }} />
                <span className="text-muted-foreground">{layer.label}</span>
              </span>
              <span className="font-mono-data font-medium text-foreground">
                {val >= 0 ? "" : ""}{val} <span className="text-muted-foreground/50 text-[9px]">({pct}%)</span>
              </span>
            </div>
          );
        })}
        <div className="flex items-center justify-between gap-4 text-[11px] pt-1.5 border-t border-border/30">
          <span className="text-muted-foreground font-medium">Total Demand</span>
          <span className="font-mono-data font-bold text-foreground">{total} units</span>
        </div>
      </div>
    </div>
  );
};

const DemandDecompositionChart = ({ data }: { data: DemandDecomposition[] }) => {
  // ─── Toggle state for each layer ───
  const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>({
    base: true,
    festivalBoost: true,
    promotionBoost: true,
    weatherImpact: true,
  });

  const toggleLayer = (key: string) => {
    setVisibleLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Summary of latest day
  const latest = data[data.length - 1];

  // ─── Insight text: calculate contribution percentages ───
  const insight = useMemo(() => {
    const totalDemand = data.reduce((sum, d) => sum + d.total, 0);
    const totalBase = data.reduce((sum, d) => sum + d.base, 0);
    const totalFestival = data.reduce((sum, d) => sum + d.festivalBoost, 0);
    const totalPromo = data.reduce((sum, d) => sum + d.promotionBoost, 0);
    const totalWeather = data.reduce((sum, d) => sum + Math.abs(d.weatherImpact), 0);

    const seasonalPromoShare = totalDemand > 0
      ? (((totalFestival + totalPromo) / totalDemand) * 100).toFixed(1)
      : "0";   
    const externalShare = totalDemand > 0
      ? ((totalWeather / totalDemand) * 100).toFixed(1)
      : "0";

    return {
      seasonalPromoShare,
      externalShare,
      basePct: totalDemand > 0 ? ((totalBase / totalDemand) * 100).toFixed(1) : "0",
    };
  }, [data]);

  // ─── Prepare cumulative data for stacked area visualization ───
  // We need to reshape data so each layer stacks properly
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      // Ensure weather impact is shown as positive contribution for visual stacking
      weatherPositive: Math.max(0, d.weatherImpact),
      weatherNegative: Math.min(0, d.weatherImpact),
    }));
  }, [data]);

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Demand Decomposition</h3>
            <p className="text-xs text-muted-foreground mt-0.5">What's driving the demand — broken down by factor</p>
          </div>
        </div>
      </div>

      {/* Layer toggle chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {LAYERS.map(layer => {
          const isVisible = visibleLayers[layer.key];
          return (
            <button
              key={layer.key}
              onClick={() => toggleLayer(layer.key)}
              className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-200
                ${isVisible
                  ? "border-border/40 bg-card hover:bg-secondary/30"
                  : "border-border/20 bg-secondary/10 opacity-50 hover:opacity-75"
                }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-sm transition-opacity"
                style={{ backgroundColor: layer.color, opacity: isVisible ? 1 : 0.3 }}
              />
              <span className="text-foreground">{layer.label}</span>
              {isVisible ? (
                <Eye className="w-3 h-3 text-muted-foreground/50" />
              ) : (
                <EyeOff className="w-3 h-3 text-muted-foreground/30" />
              )}
            </button>
          );
        })}
      </div>

      {/* Decomposition summary cards */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: "Base Demand",     value: latest.base,            color: "bg-primary/20 text-primary" },
          { label: "Seasonal Boost",  value: `+${latest.festivalBoost}`,  color: "bg-amber-500/15 text-amber-400" },
          { label: "Promo Effect",    value: `+${latest.promotionBoost}`, color: "bg-emerald-500/15 text-emerald-400" },
          { label: "External",        value: latest.weatherImpact >= 0 ? `+${latest.weatherImpact}` : `${latest.weatherImpact}`, color: "bg-cyan-500/15 text-cyan-400" },
        ].map((item) => (
          <div key={item.label} className={`rounded-xl p-2.5 text-center ${item.color.split(" ")[0]}`}>
            <p className={`text-lg font-bold tabular-nums ${item.color.split(" ")[1]}`}>{item.value}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Stacked Area Chart */}
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
            <defs>
              <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="festGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(38, 92%, 55%)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(38, 92%, 55%)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="promoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(152, 69%, 45%)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(152, 69%, 45%)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="weatherGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(200, 80%, 55%)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(200, 80%, 55%)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 20% 16%)" strokeOpacity={0.5} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "hsl(220 15% 55%)", fontSize: 11 }}
              axisLine={{ stroke: "hsl(222 20% 16%)" }}
              tickLine={false}
              label={{ value: "Time (Days)", position: "bottom", offset: -2, style: { fill: "hsl(220 15% 55%)", fontSize: 10, fontWeight: 500 } }}
            />
            <YAxis
              tick={{ fill: "hsl(220 15% 55%)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{ value: "Demand (units)", angle: -90, position: "insideLeft", offset: 5, style: { fill: "hsl(220 15% 55%)", fontSize: 10, fontWeight: 500 } }}
            />
            <Tooltip
              content={<DecompTooltip visibleLayers={visibleLayers} />}
            />

            {/* Stacked areas — order matters: base is bottom */}
            {visibleLayers.base && (
              <Area
                type="monotone"
                dataKey="base"
                stackId="demand"
                stroke="hsl(217, 91%, 60%)"
                strokeWidth={2}
                fill="url(#baseGrad)"
                name="Base Demand"
                animationDuration={800}
              />
            )}
            {visibleLayers.festivalBoost && (
              <Area
                type="monotone"
                dataKey="festivalBoost"
                stackId="demand"
                stroke="hsl(38, 92%, 55%)"
                strokeWidth={2}
                fill="url(#festGrad)"
                name="Seasonal Effect"
                animationDuration={800}
              />
            )}
            {visibleLayers.promotionBoost && (
              <Area
                type="monotone"
                dataKey="promotionBoost"
                stackId="demand"
                stroke="hsl(152, 69%, 45%)"
                strokeWidth={2}
                fill="url(#promoGrad)"
                name="Promotion Effect"
                animationDuration={800}
              />
            )}
            {visibleLayers.weatherImpact && (
              <Area
                type="monotone"
                dataKey="weatherImpact"
                stackId="demand"
                stroke="hsl(200, 80%, 55%)"
                strokeWidth={2}
                fill="url(#weatherGrad)"
                name="External Factors"
                animationDuration={800}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Insight banner ── */}
      <div className="mt-4 p-3.5 rounded-xl bg-primary/[0.04] border border-primary/15">
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-foreground leading-relaxed">
              <span className="font-semibold text-amber-400">{insight.seasonalPromoShare}%</span> of demand is driven by{" "}
              <span className="text-amber-400">seasonal</span> and{" "}
              <span className="text-emerald-400">promotional</span> factors.{" "}
              Base demand accounts for <span className="text-primary font-semibold">{insight.basePct}%</span>,{" "}
              with external factors contributing <span className="text-cyan-400 font-semibold">{insight.externalShare}%</span>.
            </p>
          </div>
        </div>
      </div>

      {/* ── Detailed breakdown instead-of message ── */}
      <div className="mt-3 p-3 rounded-xl bg-secondary/30 border border-border/20">
        <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider font-medium">Instead of just saying</p>
        <p className="text-xs text-muted-foreground/60 line-through mb-2">"Demand = {latest.total} units"</p>
        <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-medium">We show</p>
        <p className="text-xs text-foreground">
          Base demand: <span className="text-primary font-semibold">{latest.base}</span>
          {" + "}Seasonal: <span className="text-amber-400 font-semibold">+{latest.festivalBoost}</span>
          {" + "}Promo: <span className="text-emerald-400 font-semibold">+{latest.promotionBoost}</span>
          {" + "}External: <span className="text-cyan-400 font-semibold">{latest.weatherImpact >= 0 ? "+" : ""}{latest.weatherImpact}</span>
          {" = "}
          <span className="text-foreground font-bold">{latest.total} units</span>
        </p>
      </div>
    </div>
  );
};

export default DemandDecompositionChart;
