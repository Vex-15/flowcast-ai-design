import type { ReturnReason } from "@/data/types";

const ReasonClusters = ({ reasons }: { reasons: ReturnReason[] }) => {
  const maxPct = Math.max(...reasons.map((r) => r.percentage));

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-1">Reason Clusters</h3>
      <p className="text-xs text-muted-foreground mb-4">NLP-extracted return reason analysis</p>

      {/* Bubble visualization */}
      <div className="flex flex-wrap gap-3 justify-center mb-4">
        {reasons.map((r) => {
          const size = 50 + (r.percentage / maxPct) * 50;
          const opacity = 0.4 + (r.percentage / maxPct) * 0.6;
          return (
            <div
              key={r.reason}
              className="rounded-full flex flex-col items-center justify-center text-center transition-all duration-300 hover:scale-110 cursor-default"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                background: `hsl(0 70% 55% / ${opacity * 0.25})`,
                border: `1px solid hsl(0 70% 55% / ${opacity * 0.4})`,
              }}
            >
              <span className="text-xs font-bold text-foreground tabular-nums">{r.percentage}%</span>
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="space-y-1.5">
        {reasons.map((r) => (
          <div key={r.reason} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: `hsl(0 70% 55% / ${0.4 + (r.percentage / maxPct) * 0.6})` }}
              />
              <span className="text-muted-foreground">{r.reason}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-foreground font-medium tabular-nums">{r.percentage}%</span>
              <span className="text-muted-foreground/50 tabular-nums">({r.count})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReasonClusters;
