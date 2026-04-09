import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";
import type { SignalFusionResult, IntentAccelerationResult } from "@/data/types";

const SignalsView = ({
  fusion,
  intent,
}: {
  fusion: SignalFusionResult;
  intent: IntentAccelerationResult;
}) => {
  const radarData = fusion.signals.map((s) => ({
    signal: s.name.replace(/ /g, "\n"),
    value: Math.round(s.value * 100),
    fullMark: 100,
  }));

  const internal = fusion.signals.filter((s) => s.type === "internal");
  const external = fusion.signals.filter((s) => s.type === "external");

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ─── Header ─── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-foreground">
            Signal <span className="font-semibold">Fusion</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Multi-source demand signal convergence</p>
        </div>
        <div className="text-right">
          <p className="text-5xl font-extralight tracking-tighter font-mono-data text-foreground leading-none">
            {(fusion.combinedConfidence * 100).toFixed(0)}
            <span className="text-lg text-muted-foreground/40 ml-0.5">%</span>
          </p>
          <p className="label-micro text-[9px] mt-1">COMBINED CONFIDENCE</p>
        </div>
      </div>

      {/* ─── Narrative ─── */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-primary/[0.04] to-accent/[0.04] border-l-2 border-primary/30">
        <p className="text-sm text-foreground/80 leading-relaxed italic">"{fusion.narrative}"</p>
      </div>

      {/* ─── Radar + Signal List ─── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Radar chart */}
        <div className="relative">
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid
                  stroke="hsl(225 12% 14%)"
                  strokeDasharray="2 2"
                />
                <PolarAngleAxis
                  dataKey="signal"
                  tick={{ fontSize: 9, fill: "hsl(220 10% 46%)" }}
                />
                <Radar
                  name="Signal Strength"
                  dataKey="value"
                  stroke="hsl(217 91% 60%)"
                  fill="hsl(217 91% 60%)"
                  fillOpacity={0.12}
                  strokeWidth={2}
                  dot={{ r: 3, fill: "hsl(217 91% 60%)", stroke: "hsl(228 14% 5%)", strokeWidth: 2 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(225 15% 9%)",
                    border: "1px solid hsl(225 12% 16%)",
                    borderRadius: "10px",
                    fontSize: "11px",
                    boxShadow: "0 8px 32px -8px rgba(0,0,0,0.5)",
                  }}
                  formatter={(value: number) => [`${value}%`, "Strength"]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-primary/[0.06] border border-primary/10 flex items-center justify-center">
              <span className="text-xs font-mono-data text-primary font-semibold">
                {(fusion.combinedConfidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Signal breakdown */}
        <div className="space-y-5">
          {/* Internal */}
          <div>
            <p className="label-micro text-[9px] mb-3">INTERNAL SIGNALS</p>
            <div className="space-y-2">
              {internal.map((s) => (
                <div key={s.name} className="flex items-center gap-3 group">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] text-foreground/80">{s.name}</span>
                      <span className="text-[12px] font-mono-data font-semibold text-primary">
                        {(s.value * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-[3px] bg-secondary/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${s.value * 100}%`, background: "hsl(217 91% 60%)" }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* External */}
          <div>
            <p className="label-micro text-[9px] mb-3">EXTERNAL SIGNALS</p>
            <div className="space-y-2">
              {external.map((s) => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] text-foreground/80">{s.name}</span>
                      <span className="text-[12px] font-mono-data font-semibold text-accent">
                        {(s.value * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-[3px] bg-secondary/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${s.value * 100}%`, background: "hsl(265 60% 62%)" }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground/40 mt-0.5">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignalsView;
