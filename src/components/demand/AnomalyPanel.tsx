import { AlertTriangle, TrendingUp, TrendingDown, Eye, Bookmark, Clock } from "lucide-react";
import type { AnomalyEvent, IntentAccelerationResult } from "@/data/types";

const AnomalyPanel = ({
  anomalies,
  intent,
}: {
  anomalies: AnomalyEvent[];
  intent: IntentAccelerationResult;
}) => {
  return (
    <div className="space-y-6">
      {/* ─── Anomalies ─── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-sm font-semibold text-foreground">Anomalies</h2>
          {anomalies.length > 0 && (
            <span className="text-[10px] font-mono-data px-2 py-0.5 rounded-md bg-destructive/10 text-destructive font-medium">
              {anomalies.length} detected
            </span>
          )}
        </div>

        {anomalies.length === 0 ? (
          <p className="text-xs text-muted-foreground/50 py-6 text-center">No anomalies — demand is stable</p>
        ) : (
          <div className="space-y-1.5">
            {anomalies.map((a) => (
              <div
                key={a.id}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all
                  ${a.severity === "critical"
                    ? "bg-destructive/[0.04] hover:bg-destructive/[0.07]"
                    : "hover:bg-secondary/30"
                  }`}
              >
                {a.type === "spike" ? (
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-primary shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] text-foreground font-medium">{a.day}</span>
                  <span className="text-[11px] text-muted-foreground ml-2">
                    {a.predicted} → {a.actual}
                  </span>
                </div>
                <span className="text-[10px] font-mono-data text-muted-foreground">z={a.deviation}</span>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  a.severity === "critical" ? "bg-destructive animate-pulse" :
                  a.severity === "warning" ? "bg-amber-400" : "bg-muted-foreground/30"
                }`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Intent Acceleration ─── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Intent Acceleration</h2>
          {intent.spikePredicted && (
            <div className="flex items-center gap-1.5 text-amber-400">
              <AlertTriangle className="w-3 h-3" />
              <span className="text-[10px] font-semibold">Spike {intent.timeToSpike}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {intent.signals.map((signal) => {
            const icons: Record<string, typeof Eye> = { "Product Saves": Bookmark, "Page Views": Eye, "Avg Dwell Time": Clock };
            const Icon = icons[signal.metric] || Eye;
            const color = signal.trending === "up" ? "text-emerald-400" : signal.trending === "down" ? "text-destructive" : "text-muted-foreground";
            return (
              <div key={signal.metric} className="p-4 rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-colors">
                <Icon className="w-4 h-4 text-muted-foreground/40 mb-3" />
                <p className="text-xl font-light font-mono-data text-foreground tracking-tight">
                  {typeof signal.current === "number" && signal.current > 100
                    ? signal.current.toLocaleString()
                    : signal.current}
                  {signal.metric === "Avg Dwell Time" ? "s" : ""}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className={`text-[11px] font-medium font-mono-data ${color}`}>
                    {signal.changePercent > 0 ? "+" : ""}{signal.changePercent}%
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground/40 mt-1">{signal.metric}</p>
              </div>
            );
          })}
        </div>

        {/* Confidence */}
        <div className="flex items-center gap-3 mt-3">
          <span className="text-[10px] text-muted-foreground/50">Confidence</span>
          <div className="flex-1 h-1 bg-secondary/30 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${intent.confidence * 100}%`,
                background: intent.spikePredicted
                  ? "linear-gradient(90deg, hsl(38 92% 50%), hsl(0 72% 51%))"
                  : "hsl(217 91% 60%)",
              }}
            />
          </div>
          <span className="text-[11px] font-mono-data text-muted-foreground">
            {(intent.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnomalyPanel;
