import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Wrench } from "lucide-react";
import type { ReturnAnalysis } from "@/data/types";

const trendIcons = { up: TrendingUp, down: TrendingDown, stable: Minus };

const ReturnIntelligence = ({ data, skuName }: { data: ReturnAnalysis; skuName: string }) => {
  const riskColor = data.riskScore > 60
    ? "text-destructive" : data.riskScore > 35
    ? "text-amber-400" : "text-emerald-400";

  const riskBg = data.riskScore > 60
    ? "bg-destructive/15" : data.riskScore > 35
    ? "bg-amber-500/15" : "bg-emerald-500/15";

  return (
    <div className="space-y-5">
      {/* Overview */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Return Intelligence</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{skuName}</p>
          </div>
          <div className={`px-3 py-1.5 rounded-lg ${riskBg} ${riskColor} text-xs font-semibold`}>
            Risk Score: {data.riskScore}/100
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="rounded-xl bg-secondary/30 border border-border/20 p-3 text-center">
            <p className="text-xl font-bold text-foreground tabular-nums">
              {(data.returnRate * 100).toFixed(1)}%
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Return Rate</p>
          </div>
          <div className="rounded-xl bg-secondary/30 border border-border/20 p-3 text-center">
            <p className="text-xl font-bold text-foreground tabular-nums">{data.reportedDemand}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Reported Sales</p>
          </div>
          <div className="rounded-xl bg-secondary/30 border border-border/20 p-3 text-center">
            <p className="text-xl font-bold text-foreground tabular-nums">{data.trueDemand}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">True Demand</p>
          </div>
        </div>

        {/* Return Reasons */}
        <h4 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">Top Return Reasons</h4>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.reasons}
              layout="vertical"
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="reason"
                width={160}
                tick={{ fill: "hsl(220 15% 55%)", fontSize: 10 }}
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
              <Bar
                dataKey="percentage"
                fill="hsl(0 70% 55%)"
                radius={[0, 6, 6, 0]}
                barSize={14}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trend indicators */}
        <div className="flex flex-wrap gap-2 mt-3">
          {data.reasons.slice(0, 4).map((r) => {
            const TrendIcon = trendIcons[r.trend];
            const color = r.trend === "up" ? "text-destructive" : r.trend === "down" ? "text-emerald-400" : "text-muted-foreground";
            return (
              <div key={r.reason} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <TrendIcon className={`w-3 h-3 ${color}`} />
                <span className="truncate max-w-[120px]">{r.reason}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Suggested Fixes */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Wrench className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Suggested Fixes</h3>
        </div>
        <div className="space-y-2">
          {data.suggestedFixes.map((fix, i) => (
            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-secondary/20 border border-border/10">
              <span className="text-[10px] text-primary font-bold mt-0.5">{i + 1}</span>
              <p className="text-xs text-muted-foreground leading-relaxed">{fix}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReturnIntelligence;
