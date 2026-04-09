import { TrendingUp, TrendingDown, Minus, Globe, BarChart3 } from "lucide-react";
import type { SignalFusionResult } from "@/data/types";
import SignalConfidence from "./SignalConfidence";

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const trendColors = {
  up: "text-emerald-400",
  down: "text-destructive",
  stable: "text-muted-foreground",
};

const SignalFusion = ({ data }: { data: SignalFusionResult }) => {
  const internal = data.signals.filter((s) => s.type === "internal");
  const external = data.signals.filter((s) => s.type === "external");

  return (
    <div className="space-y-5">
      {/* Narrative */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
            <Globe className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Signal Fusion Engine</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Multi-source demand signal analysis</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10 mb-5">
          <p className="text-sm text-foreground leading-relaxed italic">
            "{data.narrative}"
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Internal Signals */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-3.5 h-3.5 text-primary" />
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Internal Signals</h4>
            </div>
            <div className="space-y-2">
              {internal.map((signal) => {
                const TrendIcon = trendIcons[signal.trend];
                return (
                  <div key={signal.name} className="rounded-xl bg-secondary/30 border border-border/20 p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-foreground">{signal.name}</span>
                      <div className="flex items-center gap-1.5">
                        <TrendIcon className={`w-3 h-3 ${trendColors[signal.trend]}`} />
                        <span className="text-sm font-bold text-foreground tabular-nums">
                          {(signal.value * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${signal.value * 100}%`,
                          background: `hsl(215 90% 60%)`,
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5">{signal.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* External Signals */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-3.5 h-3.5 text-accent" />
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">External Signals</h4>
            </div>
            <div className="space-y-2">
              {external.map((signal) => {
                const TrendIcon = trendIcons[signal.trend];
                return (
                  <div key={signal.name} className="rounded-xl bg-secondary/30 border border-border/20 p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-foreground">{signal.name}</span>
                      <div className="flex items-center gap-1.5">
                        <TrendIcon className={`w-3 h-3 ${trendColors[signal.trend]}`} />
                        <span className="text-sm font-bold text-foreground tabular-nums">
                          {(signal.value * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${signal.value * 100}%`,
                          background: `hsl(260 60% 65%)`,
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5">{signal.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Confidence Score */}
      <SignalConfidence data={data} />
    </div>
  );
};

export default SignalFusion;
