import {
  AreaChart, Area, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, ReferenceLine,
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
  const latest = decomposition[decomposition.length - 1];
  const totalPredicted = forecast.reduce((s, f) => s + f.predicted, 0);

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

      {/* ─── Full-bleed forecast chart ─── */}
      <div className="relative -mx-6">
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="confBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(265 60% 62%)" stopOpacity={0.06} />
                  <stop offset="100%" stopColor="hsl(265 60% 62%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "hsl(220 10% 36%)" }}
                axisLine={false}
                tickLine={false}
                dy={8}
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
                labelStyle={{ color: "hsl(220 10% 46%)", fontSize: "10px" }}
              />
              {/* Confidence band */}
              <Area type="monotone" dataKey="upper" stroke="none" fill="url(#confBand)" />
              <Area type="monotone" dataKey="lower" stroke="none" fill="transparent" />
              {/* Actual */}
              <Area
                type="monotone"
                dataKey="actual"
                stroke="hsl(217 91% 60%)"
                strokeWidth={2}
                fill="url(#forecastGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "hsl(217 91% 60%)", stroke: "hsl(228 14% 5%)", strokeWidth: 2 }}
                connectNulls={false}
              />
              {/* Predicted */}
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="hsl(265 60% 62%)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {/* Chart legend */}
        <div className="absolute top-4 left-8 flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-[2px] bg-primary rounded-full" />
            <span className="text-[10px] text-muted-foreground">Actual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-[2px] rounded-full" style={{ background: "hsl(265 60% 62%)", opacity: 0.7 }} />
            <span className="text-[10px] text-muted-foreground">Predicted</span>
          </div>
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
