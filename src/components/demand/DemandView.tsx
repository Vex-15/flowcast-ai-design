import { useState } from "react";
import {
  AreaChart, Area, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid,
} from "recharts";
import type { ForecastPoint, DemandDecomposition } from "@/data/types";

const DemandView = ({
  forecast,
  decomposition,
  skuName,
}: {
  forecast: ForecastPoint[];
  decomposition: DemandDecomposition[];
  skuName: string;
}) => {
  const [showConfidence, setShowConfidence] = useState(true);
  const [showActual, setShowActual] = useState(true);
  const [showPredicted, setShowPredicted] = useState(true);

  const latest = decomposition[decomposition.length - 1];
  const totalPredicted = forecast.reduce((s, f) => s + f.predicted, 0);
  const totalActual = forecast.reduce((s, f) => s + (f.actual || 0), 0);
  const accuracy = totalActual > 0 ? ((1 - Math.abs(totalPredicted - totalActual) / totalActual) * 100) : 0;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-[hsl(225,15%,9%)] border border-[hsl(225,12%,16%)] rounded-xl p-3 shadow-2xl shadow-black/50">
        <p className="text-[10px] text-muted-foreground/50 mb-2">{label}</p>
        {payload.map((entry: any, i: number) => {
          if (entry.value === undefined || entry.value === null) return null;
          const colors: Record<string, string> = {
            actual: "text-primary",
            predicted: "text-purple-400",
            upper: "text-purple-300/50",
            lower: "text-purple-300/50",
          };
          const labels: Record<string, string> = {
            actual: "Actual",
            predicted: "Forecast",
            upper: "Upper CI",
            lower: "Lower CI",
          };
          return (
            <div key={i} className="flex items-center justify-between gap-4">
              <span className="text-[10px] text-muted-foreground">{labels[entry.dataKey] || entry.dataKey}</span>
              <span className={`text-[11px] font-mono-data font-semibold ${colors[entry.dataKey] || "text-foreground"}`}>
                {Math.round(entry.value)}
              </span>
            </div>
          );
        })}
        {/* Show deviation if both actual and predicted exist */}
        {payload.length >= 2 && payload[0]?.value && payload.find((p: any) => p.dataKey === "predicted")?.value && (
          <div className="mt-2 pt-2 border-t border-border/20">
            <span className="text-[9px] text-muted-foreground/40">
              Deviation: {(() => {
                const actual = payload.find((p: any) => p.dataKey === "actual")?.value;
                const predicted = payload.find((p: any) => p.dataKey === "predicted")?.value;
                if (!actual || !predicted) return "N/A";
                const pct = ((actual - predicted) / predicted * 100).toFixed(1);
                return `${Number(pct) > 0 ? "+" : ""}${pct}%`;
              })()}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ─── Header ─── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-foreground">
            Demand <span className="font-semibold">Intelligence</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{skuName}</p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-light tracking-tighter text-foreground font-mono-data leading-none">
            {totalPredicted.toLocaleString()}
          </p>
          <p className="label-micro text-[9px] mt-1">14-DAY PREDICTED UNITS</p>
        </div>
      </div>

      {/* ─── Chart overlay controls ─── */}
      <div className="flex items-center gap-4">
        <span className="text-[10px] text-muted-foreground/40">Overlays:</span>
        {[
          { key: "actual", label: "Actual", color: "bg-primary", state: showActual, setter: setShowActual },
          { key: "predicted", label: "Forecast", color: "bg-purple-500", state: showPredicted, setter: setShowPredicted },
          { key: "confidence", label: "Confidence Band", color: "bg-purple-500/30", state: showConfidence, setter: setShowConfidence },
        ].map(toggle => (
          <button
            key={toggle.key}
            onClick={() => toggle.setter(!toggle.state)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
              toggle.state
                ? "bg-secondary/40 text-foreground"
                : "text-muted-foreground/40 hover:text-muted-foreground"
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-sm ${toggle.color} ${!toggle.state ? "opacity-30" : ""}`} />
            {toggle.label}
          </button>
        ))}
        {/* Accuracy */}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground/40">Accuracy</span>
          <span className={`text-[11px] font-mono-data font-semibold ${accuracy > 90 ? "text-emerald-400" : accuracy > 80 ? "text-amber-400" : "text-destructive"}`}>
            {accuracy.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* ─── Full-bleed forecast chart ─── */}
      <div className="relative -mx-6">
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="confBandUpper" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(265 60% 62%)" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="hsl(265 60% 62%)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="confBandLower" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(265 60% 62%)" stopOpacity={0.02} />
                  <stop offset="100%" stopColor="hsl(265 60% 62%)" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 12% 14%)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "hsl(220 10% 36%)" }}
                axisLine={false}
                tickLine={false}
                dy={8}
              />
              <YAxis 
                tick={{ fontSize: 9, fill: "hsl(220 10% 36%)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Confidence band */}
              {showConfidence && (
                <>
                  <Area type="monotone" dataKey="upper" stroke="hsl(265 60% 62% / 0.2)" strokeWidth={1} strokeDasharray="2 2" fill="url(#confBandUpper)" name="Upper CI" />
                  <Area type="monotone" dataKey="lower" stroke="hsl(265 60% 62% / 0.2)" strokeWidth={1} strokeDasharray="2 2" fill="url(#confBandLower)" name="Lower CI" />
                </>
              )}
              
              {/* Actual */}
              {showActual && (
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="hsl(217 91% 60%)"
                  strokeWidth={2.5}
                  fill="url(#forecastGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: "hsl(217 91% 60%)", stroke: "hsl(228 14% 5%)", strokeWidth: 2 }}
                  connectNulls={false}
                  name="Actual"
                />
              )}
              
              {/* Predicted */}
              {showPredicted && (
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="hsl(265 60% 62%)"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                  activeDot={{ r: 4, fill: "hsl(265 60% 62%)", stroke: "hsl(228 14% 5%)", strokeWidth: 2 }}
                  name="Forecast"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {/* Updated chart legend */}
        <div className="absolute top-4 left-8 flex items-center gap-5">
          {showActual && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-[2.5px] bg-primary rounded-full" />
              <span className="text-[10px] text-muted-foreground">Actual</span>
            </div>
          )}
          {showPredicted && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-[2px] rounded-full" style={{ background: "hsl(265 60% 62%)", opacity: 0.7 }} />
              <span className="text-[10px] text-muted-foreground">Forecast</span>
            </div>
          )}
          {showConfidence && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-3 rounded-sm bg-purple-500/10 border border-purple-500/20" />
              <span className="text-[10px] text-muted-foreground">95% CI</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Decomposition: Waterfall-style pills ─── */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-4">Demand Decomposition</h2>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Base */}
          <div className="flex flex-col items-center">
            <p className="text-2xl font-light font-mono-data text-primary tracking-tight">{latest.base}</p>
            <p className="label-micro text-[8px] mt-1">BASE</p>
          </div>

          <span className="text-muted-foreground/30 text-lg">+</span>

          {/* Festival */}
          <div className="flex flex-col items-center px-4 py-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/10">
            <p className="text-2xl font-light font-mono-data text-amber-400 tracking-tight">+{latest.festivalBoost}</p>
            <p className="label-micro text-[8px] mt-1 text-amber-400/60">FESTIVAL</p>
          </div>

          <span className="text-muted-foreground/30 text-lg">+</span>

          {/* Promo */}
          <div className="flex flex-col items-center px-4 py-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/10">
            <p className="text-2xl font-light font-mono-data text-emerald-400 tracking-tight">+{latest.promotionBoost}</p>
            <p className="label-micro text-[8px] mt-1 text-emerald-400/60">PROMO</p>
          </div>

          <span className="text-muted-foreground/30 text-lg">+</span>

          {/* Weather */}
          <div className="flex flex-col items-center px-4 py-3 rounded-xl bg-cyan-500/[0.06] border border-cyan-500/10">
            <p className={`text-2xl font-light font-mono-data tracking-tight ${latest.weatherImpact >= 0 ? "text-cyan-400" : "text-destructive"}`}>
              {latest.weatherImpact >= 0 ? "+" : ""}{latest.weatherImpact}
            </p>
            <p className="label-micro text-[8px] mt-1 text-cyan-400/60">WEATHER</p>
          </div>

          <span className="text-muted-foreground/30 text-lg">=</span>

          {/* Total */}
          <div className="flex flex-col items-center px-5 py-3 rounded-xl gradient-border">
            <p className="text-3xl font-semibold font-mono-data text-foreground tracking-tighter">{latest.total}</p>
            <p className="label-micro text-[8px] mt-1">TOTAL</p>
          </div>
        </div>
      </div>

      {/* ─── Daily breakdown (minimal bar visualization) ─── */}
      <div className="grid grid-cols-7 gap-1">
        {decomposition.map((d) => {
          const max = Math.max(...decomposition.map((dd) => dd.total));
          const height = (d.total / max) * 100;
          return (
            <div key={d.label} className="flex flex-col items-center gap-2 group cursor-default">
              <span className="text-[10px] font-mono-data text-muted-foreground/50 group-hover:text-foreground transition-colors">
                {d.total}
              </span>
              <div className="w-full h-20 flex items-end rounded-lg overflow-hidden bg-secondary/20">
                <div
                  className="w-full rounded-t-md transition-all duration-500 group-hover:opacity-100 opacity-70"
                  style={{
                    height: `${height}%`,
                    background: `linear-gradient(180deg, hsl(217 91% 60% / 0.5) 0%, hsl(265 60% 62% / 0.3) 100%)`,
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground/40">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DemandView;
