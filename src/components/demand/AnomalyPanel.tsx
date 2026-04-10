import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import type { AnomalyEvent, IntentAccelerationResult } from "@/data/types";
import IntentSpikePredictor from "@/components/signals/IntentSpikePredictor";

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

      {/* ─── Intent Spike Predictor (replaces old static Intent Acceleration) ─── */}
      <div className="border-t border-border/15 pt-5">
        <IntentSpikePredictor baseIntent={intent} />
      </div>
    </div>
  );
};

export default AnomalyPanel;
