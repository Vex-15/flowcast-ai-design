import { Brain } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { Explanation } from "@/data/types";

const ExplainPanel = ({ data }: { data: Explanation }) => {
  return (
    <div className="space-y-5">
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Explainable AI Layer</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{data.summary}</p>
          </div>
        </div>

        {/* Confidence */}
        <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-secondary/20 border border-border/20">
          <span className="text-xs text-muted-foreground">Model Confidence:</span>
          <div className="flex-1 h-2.5 bg-secondary/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${data.confidence * 100}%`,
                background: "linear-gradient(90deg, hsl(215 90% 60%), hsl(260 60% 65%))",
              }}
            />
          </div>
          <span className="text-sm font-bold text-foreground tabular-nums">
            {(data.confidence * 100).toFixed(0)}%
          </span>
        </div>

        {/* Feature Importance Chart */}
        <h4 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">
          Feature Importance (SHAP-style)
        </h4>
        <div className="h-[240px] w-full mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.factors}
              layout="vertical"
              margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
            >
              <XAxis type="number" hide domain={[0, 0.5]} />
              <YAxis
                type="category"
                dataKey="feature"
                width={150}
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
                formatter={(value: number) => [`${(value * 100).toFixed(0)}%`, "Importance"]}
              />
              <Bar dataKey="importance" radius={[0, 6, 6, 0]} barSize={16}>
                {data.factors.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.direction === "positive" ? "hsl(215 90% 60%)" : "hsl(0 70% 55%)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-5">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 rounded-sm bg-primary" />
            <span className="text-[10px] text-muted-foreground">Positive Impact</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 rounded-sm bg-destructive" />
            <span className="text-[10px] text-muted-foreground">Negative Impact</span>
          </div>
        </div>

        {/* Narrative */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
            AI Explanation
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            {data.narrative}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExplainPanel;
