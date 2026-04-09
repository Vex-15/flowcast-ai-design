import { AlertTriangle, TrendingDown, TrendingUp, Eye, Bookmark, Clock } from "lucide-react";
import type { AnomalyEvent, IntentAccelerationResult } from "@/data/types";

const DemandShiftDetector = ({
  anomalies,
  intent,
}: {
  anomalies: AnomalyEvent[];
  intent: IntentAccelerationResult;
}) => {
  const intentIcons: Record<string, typeof Eye> = {
    "Product Saves": Bookmark,
    "Page Views": Eye,
    "Avg Dwell Time": Clock,
  };

  return (
    <div className="space-y-5">
      {/* Anomaly Detection */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Real-Time Demand Shift Detector</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Z-score anomaly detection on predicted vs actual</p>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-lg bg-primary/10 text-primary font-medium">
            {anomalies.length} anomalies detected
          </span>
        </div>

        {anomalies.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No anomalies detected — demand is stable
          </div>
        ) : (
          <div className="space-y-2">
            {anomalies.map((a) => (
              <div
                key={a.id}
                className={`flex items-center gap-3 rounded-xl p-3 border transition-all
                  ${a.severity === "critical"
                    ? "border-destructive/30 bg-destructive/5"
                    : a.severity === "warning"
                    ? "border-amber-500/20 bg-amber-500/5"
                    : "border-border/20 bg-secondary/20"
                  }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                  ${a.type === "spike" ? "bg-amber-500/15" : "bg-blue-500/15"}`}
                >
                  {a.type === "spike" ? (
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-blue-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground capitalize">{a.type}</span>
                    <span className="text-[9px] text-muted-foreground">on {a.day}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Predicted: {a.predicted} → Actual: {a.actual} (z-score: {a.deviation})
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg
                  ${a.severity === "critical" ? "bg-destructive/15 text-destructive" :
                    a.severity === "warning" ? "bg-amber-500/15 text-amber-400" :
                    "bg-primary/15 text-primary"}`}
                >
                  {a.severity}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Intent Acceleration */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Intent Acceleration Signal</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Pre-sales signals predicting future demand</p>
          </div>
          {intent.spikePredicted && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 animate-pulse-glow">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-semibold text-amber-400">
                Spike Predicted {intent.timeToSpike}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {intent.signals.map((signal) => {
            const Icon = intentIcons[signal.metric] || Eye;
            const changeColor = signal.trending === "up"
              ? "text-emerald-400"
              : signal.trending === "down"
              ? "text-destructive"
              : "text-muted-foreground";

            return (
              <div
                key={signal.metric}
                className="rounded-xl bg-secondary/30 border border-border/20 p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-medium">{signal.metric}</span>
                </div>
                <p className="text-lg font-bold text-foreground tabular-nums">
                  {typeof signal.current === "number" && signal.current > 100
                    ? signal.current.toLocaleString()
                    : signal.current}
                  {signal.metric === "Avg Dwell Time" ? "s" : ""}
                </p>
                <p className={`text-xs font-medium tabular-nums ${changeColor}`}>
                  {signal.changePercent > 0 ? "+" : ""}
                  {signal.changePercent}%
                  <span className="text-muted-foreground/50 font-normal"> vs prev</span>
                </p>
              </div>
            );
          })}
        </div>

        {/* Confidence */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 h-2 bg-secondary/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${intent.confidence * 100}%`,
                background: `linear-gradient(90deg, hsl(215 90% 60%), hsl(260 60% 65%))`,
              }}
            />
          </div>
          <span className="text-xs font-semibold text-foreground tabular-nums">
            {(intent.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default DemandShiftDetector;
