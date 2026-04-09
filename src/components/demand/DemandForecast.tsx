import {
  AreaChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import type { ForecastPoint } from "@/data/types";

const DemandForecast = ({ data, skuName, horizonDays = 7 }: { data: ForecastPoint[]; skuName: string; horizonDays?: number }) => {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{horizonDays}-Day Demand Forecast</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {skuName} — predicted vs actual with confidence band
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-medium text-emerald-400">94.1% accuracy</span>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="forecastConfBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(215 90% 60%)" stopOpacity={0.08} />
                <stop offset="95%" stopColor="hsl(215 90% 60%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="actualGradDemand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(215 90% 60%)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(215 90% 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 20% 16%)" />
            <XAxis
              dataKey="date"
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
            {/* Confidence band */}
            <Area type="monotone" dataKey="upper" stroke="none" fill="url(#forecastConfBand)" />
            <Area type="monotone" dataKey="lower" stroke="none" fill="transparent" />
            {/* Actual */}
            <Area
              type="monotone"
              dataKey="actual"
              stroke="hsl(215 90% 60%)"
              strokeWidth={2}
              fill="url(#actualGradDemand)"
              dot={{ fill: "hsl(215 90% 60%)", r: 3, strokeWidth: 0 }}
              connectNulls={false}
            />
            {/* Predicted */}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="hsl(260 60% 65%)"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-primary rounded-full" />
          <span className="text-[10px] text-muted-foreground">Actual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-accent rounded-full opacity-70" style={{ borderTop: "1px dashed" }} />
          <span className="text-[10px] text-muted-foreground">Predicted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 bg-primary/10 rounded" />
          <span className="text-[10px] text-muted-foreground">Confidence Band</span>
        </div>
      </div>
    </div>
  );
};

export default DemandForecast;
