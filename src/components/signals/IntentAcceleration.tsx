import { AlertTriangle, Eye, Bookmark, Clock } from "lucide-react";
import type { IntentAccelerationResult } from "@/data/types";

const intentIcons: Record<string, typeof Eye> = {
  "Product Saves": Bookmark,
  "Page Views": Eye,
  "Avg Dwell Time": Clock,
};

const IntentAcceleration = ({ data }: { data: IntentAccelerationResult }) => {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Intent Acceleration</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pre-sales behavioral signals predicting future spike
          </p>
        </div>
        {data.spikePredicted && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-semibold text-amber-400">
              Spike in {data.timeToSpike}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {data.signals.map((signal) => {
          const Icon = intentIcons[signal.metric] || Eye;
          const color = signal.trending === "up" ? "text-emerald-400" : signal.trending === "down" ? "text-destructive" : "text-muted-foreground";
          return (
            <div key={signal.metric} className="rounded-xl bg-secondary/30 border border-border/20 p-4 text-center">
              <Icon className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-xl font-bold text-foreground tabular-nums">
                {typeof signal.current === "number" && signal.current > 100
                  ? signal.current.toLocaleString()
                  : signal.current}
                {signal.metric === "Avg Dwell Time" ? "s" : ""}
              </p>
              <p className={`text-xs font-semibold tabular-nums mt-0.5 ${color}`}>
                {signal.changePercent > 0 ? "↑ " : signal.changePercent < 0 ? "↓ " : "→ "}
                {Math.abs(signal.changePercent)}%
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">{signal.metric}</p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 border border-border/20">
        <span className="text-xs text-muted-foreground">Spike Confidence:</span>
        <div className="flex-1 h-2 bg-secondary/50 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${data.confidence * 100}%`,
              background: data.spikePredicted
                ? "linear-gradient(90deg, hsl(38 90% 55%), hsl(0 70% 55%))"
                : "linear-gradient(90deg, hsl(215 90% 60%), hsl(260 60% 65%))",
            }}
          />
        </div>
        <span className="text-xs font-bold text-foreground tabular-nums">
          {(data.confidence * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
};

export default IntentAcceleration;
