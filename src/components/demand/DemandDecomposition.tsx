import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { DemandDecomposition } from "@/data/types";

const DemandDecompositionChart = ({ data }: { data: DemandDecomposition[] }) => {
  // Summary of latest day
  const latest = data[data.length - 1];

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Demand Decomposition</h3>
          <p className="text-xs text-muted-foreground mt-0.5">What's driving the demand — broken down</p>
        </div>
      </div>

      {/* Decomposition summary cards */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: "Base Demand",     value: latest.base,            color: "bg-primary/20 text-primary" },
          { label: "Festival Boost",  value: `+${latest.festivalBoost}`,  color: "bg-amber-500/15 text-amber-400" },
          { label: "Promo Boost",     value: `+${latest.promotionBoost}`, color: "bg-emerald-500/15 text-emerald-400" },
          { label: "Weather",         value: latest.weatherImpact >= 0 ? `+${latest.weatherImpact}` : `${latest.weatherImpact}`, color: "bg-cyan-500/15 text-cyan-400" },
        ].map((item) => (
          <div key={item.label} className={`rounded-xl p-2.5 text-center ${item.color.split(" ")[0]}`}>
            <p className={`text-lg font-bold tabular-nums ${item.color.split(" ")[1]}`}>{item.value}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Stacked bar chart */}
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 20% 16%)" />
            <XAxis
              dataKey="label"
              tick={{ fill: "hsl(220 15% 55%)", fontSize: 11 }}
              axisLine={{ stroke: "hsl(222 20% 16%)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(220 15% 55%)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(222 25% 10%)",
                border: "1px solid hsl(222 20% 16%)",
                borderRadius: "12px",
                fontSize: "11px",
                color: "hsl(220 20% 93%)",
              }}
            />
            <Bar dataKey="base" name="Base Demand" stackId="stack" fill="hsl(215 90% 60%)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="festivalBoost" name="Festival" stackId="stack" fill="hsl(38 90% 55%)" />
            <Bar dataKey="promotionBoost" name="Promotion" stackId="stack" fill="hsl(160 60% 45%)" />
            <Bar dataKey="weatherImpact" name="Weather" stackId="stack" fill="hsl(200 80% 55%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Instead-of message */}
      <div className="mt-3 p-3 rounded-xl bg-secondary/30 border border-border/20">
        <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider font-medium">Instead of just saying</p>
        <p className="text-xs text-muted-foreground/60 line-through mb-2">"Demand = {latest.total} units"</p>
        <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-medium">We show</p>
        <p className="text-xs text-foreground">
          Base demand: <span className="text-primary font-semibold">{latest.base}</span>
          {" + "}Festival: <span className="text-amber-400 font-semibold">+{latest.festivalBoost}</span>
          {" + "}Promo: <span className="text-emerald-400 font-semibold">+{latest.promotionBoost}</span>
          {" + "}Weather: <span className="text-cyan-400 font-semibold">{latest.weatherImpact >= 0 ? "+" : ""}{latest.weatherImpact}</span>
          {" = "}
          <span className="text-foreground font-bold">{latest.total} units</span>
        </p>
      </div>
    </div>
  );
};

export default DemandDecompositionChart;
