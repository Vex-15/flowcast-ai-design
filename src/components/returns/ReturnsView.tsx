import { Ghost, Wrench } from "lucide-react";
import type { ReturnAnalysis } from "@/data/types";

const ReturnsView = ({ data, skuName }: { data: ReturnAnalysis; skuName: string }) => {
  const riskColor = data.riskScore > 60
    ? "text-destructive" : data.riskScore > 35
    ? "text-amber-400" : "text-emerald-400";
  const riskGlow = data.riskScore > 60
    ? "glow-destructive" : "";

  const maxPct = Math.max(...data.reasons.map((r) => r.percentage));

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ─── Header ─── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-foreground">
            Return <span className="font-semibold">Intelligence</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{skuName}</p>
        </div>
        <div className={`text-right ${riskGlow}`}>
          <p className={`text-5xl font-extralight tracking-tighter font-mono-data leading-none ${riskColor}`}>
            {data.riskScore}
            <span className="text-lg text-muted-foreground/30 ml-0.5">/100</span>
          </p>
          <p className="label-micro text-[9px] mt-1">RETURN RISK SCORE</p>
        </div>
      </div>

      {/* ─── Three-metric strip ─── */}
      <div className="grid grid-cols-3 gap-px bg-border/20 rounded-xl overflow-hidden">
        <div className="bg-card p-4">
          <p className="text-2xl font-light font-mono-data text-foreground tracking-tight">
            {(data.returnRate * 100).toFixed(1)}%
          </p>
          <p className="label-micro text-[8px] mt-1">RETURN RATE</p>
        </div>
        <div className="bg-card p-4">
          <p className="text-2xl font-light font-mono-data text-foreground tracking-tight">{data.reportedDemand}</p>
          <p className="label-micro text-[8px] mt-1">REPORTED SALES</p>
        </div>
        <div className="bg-card p-4">
          <p className="text-2xl font-light font-mono-data text-emerald-400 tracking-tight">{data.trueDemand}</p>
          <p className="label-micro text-[8px] mt-1">TRUE DEMAND</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ─── Reason Heat Bars ─── */}
        <div>
          <p className="label-micro text-[9px] mb-3">RETURN REASONS</p>
          <div className="space-y-2">
            {data.reasons.map((r) => {
              const intensity = r.percentage / maxPct;
              return (
                <div key={r.reason} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-foreground/70 truncate max-w-[200px]">{r.reason}</span>
                    <span className="text-[11px] font-mono-data text-muted-foreground ml-2">{r.percentage}%</span>
                  </div>
                  <div className="w-full h-6 rounded-md overflow-hidden bg-secondary/20 relative">
                    <div
                      className="h-full rounded-md transition-all duration-700 group-hover:opacity-100 opacity-80"
                      style={{
                        width: `${r.percentage}%`,
                        background: `linear-gradient(90deg, hsl(0 72% 51% / ${0.15 + intensity * 0.35}), hsl(38 92% 50% / ${0.1 + intensity * 0.2}))`,
                      }}
                    />
                    {/* Hover tooltip */}
                    <div className="absolute inset-0 flex items-center px-2">
                      <span className="text-[10px] font-mono-data text-foreground/60">{r.count} returns</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Phantom Demand + Fixes ─── */}
        <div className="space-y-5">
          {/* Phantom Demand */}
          <div className="p-4 rounded-xl bg-secondary/20">
            <div className="flex items-center gap-2 mb-3">
              <Ghost className="w-4 h-4 text-accent/60" />
              <p className="text-xs font-semibold text-foreground">Phantom Demand Correction</p>
            </div>

            {/* Formula */}
            <div className="font-mono-data text-xs text-muted-foreground mb-3 leading-relaxed">
              <span className="text-emerald-400">True</span> = <span className="text-primary">{data.reportedDemand}</span> − (<span className="text-amber-400">{(data.returnRate * 100).toFixed(1)}%</span> × <span className="text-primary">{data.reportedDemand}</span>) = <span className="text-emerald-400 font-semibold">{data.trueDemand}</span>
            </div>

            {/* Visual bar */}
            <div className="flex items-center gap-0 h-8 rounded-lg overflow-hidden">
              <div
                className="h-full flex items-center justify-center text-[10px] font-mono-data text-emerald-400/80 bg-emerald-500/10"
                style={{ width: `${(data.trueDemand / data.reportedDemand) * 100}%` }}
              >
                {data.trueDemand}
              </div>
              <div
                className="h-full flex items-center justify-center text-[10px] font-mono-data text-destructive/60 bg-destructive/[0.06]"
                style={{ width: `${(data.phantomDemandGap / data.reportedDemand) * 100}%` }}
              >
                {data.phantomDemandGap}
              </div>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-muted-foreground/40">Real demand</span>
              <span className="text-[9px] text-muted-foreground/40">Phantom ({((data.phantomDemandGap / data.reportedDemand) * 100).toFixed(1)}%)</span>
            </div>
          </div>

          {/* Suggested Fixes */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="w-3.5 h-3.5 text-muted-foreground/40" />
              <p className="label-micro text-[9px]">SUGGESTED FIXES</p>
            </div>
            <div className="space-y-1.5">
              {data.suggestedFixes.map((fix, i) => (
                <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg hover:bg-secondary/20 transition-colors">
                  <span className="text-[10px] text-primary/60 font-mono-data mt-0.5">{i + 1}</span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{fix}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnsView;
