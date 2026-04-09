import type { SignalFusionResult } from "@/data/types";

const SignalConfidence = ({ data }: { data: SignalFusionResult }) => {
  const pct = data.combinedConfidence * 100;
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - data.combinedConfidence);

  const topSignals = data.signals.filter((s) => s.value > 0.4).sort((a, b) => b.value - a.value).slice(0, 3);

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Signal Confidence Score</h3>

      <div className="flex items-center gap-8">
        {/* Radial gauge */}
        <div className="relative w-36 h-36 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
            {/* Background ring */}
            <circle cx="70" cy="70" r={radius} fill="none" stroke="hsl(222 20% 16%)" strokeWidth="10" />
            {/* Progress ring */}
            <circle
              cx="70" cy="70" r={radius}
              fill="none"
              stroke="url(#confidenceGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="confidenceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(215 90% 60%)" />
                <stop offset="100%" stopColor="hsl(260 60% 65%)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground tabular-nums">{pct.toFixed(0)}%</span>
            <span className="text-[9px] text-muted-foreground">Combined</span>
          </div>
        </div>

        {/* Individual scores */}
        <div className="flex-1 space-y-3">
          {topSignals.map((signal) => (
            <div key={signal.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{signal.name}</span>
                <span className="text-xs font-semibold text-foreground tabular-nums">
                  {signal.value.toFixed(2)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${signal.value * 100}%`,
                    background: signal.type === "internal"
                      ? "hsl(215 90% 60%)"
                      : "hsl(260 60% 65%)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SignalConfidence;
