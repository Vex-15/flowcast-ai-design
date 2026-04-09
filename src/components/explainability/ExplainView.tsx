import { useState } from "react";
import { ChevronDown, ChevronUp, Brain, Info, Target } from "lucide-react";
import type { Explanation } from "@/data/types";

const ExplainView = ({ data }: { data: Explanation }) => {
  const [showBreakdownDetails, setShowBreakdownDetails] = useState(false);
  const maxImportance = Math.max(...data.factors.map((f) => f.importance));

  const confidenceLabel = data.confidence > 0.85 ? "Very High" : data.confidence > 0.75 ? "High" : data.confidence > 0.6 ? "Moderate" : "Low";
  const confidenceColor = data.confidence > 0.85 ? "text-emerald-400" : data.confidence > 0.75 ? "text-primary" : data.confidence > 0.6 ? "text-amber-400" : "text-destructive";

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ─── Header ─── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-foreground">
            Explain<span className="font-semibold">ability</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{data.summary}</p>
        </div>
        <div className="text-right">
          <p className="text-5xl font-extralight tracking-tighter font-mono-data text-foreground leading-none">
            {(data.confidence * 100).toFixed(0)}
            <span className="text-lg text-muted-foreground/30 ml-0.5">%</span>
          </p>
          <div className="flex items-center gap-1.5 justify-end mt-1">
            <span className={`text-[10px] font-semibold ${confidenceColor}`}>{confidenceLabel}</span>
            <span className="label-micro text-[9px]">CONFIDENCE</span>
          </div>
        </div>
      </div>

      {/* ─── Confidence Progress Bar ─── */}
      <div className="p-4 rounded-xl bg-card border border-border/20">
        <div className="flex items-center gap-3 mb-3">
          <Target className="w-4 h-4 text-primary/60" />
          <span className="text-xs font-semibold text-foreground">Forecast Confidence: {(data.confidence * 100).toFixed(0)}%</span>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
            data.confidence > 0.85 ? "bg-emerald-500/15 text-emerald-400" :
            data.confidence > 0.75 ? "bg-primary/15 text-primary" :
            data.confidence > 0.6 ? "bg-amber-500/15 text-amber-400" :
            "bg-destructive/15 text-destructive"
          }`}>
            {confidenceLabel}
          </span>
        </div>
        <div className="w-full h-3 bg-secondary/30 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${data.confidence * 100}%`,
              background: `linear-gradient(90deg, hsl(217 91% 60%), hsl(265 60% 62%))`,
            }}
          />
        </div>
        
        {/* Segmented Confidence Breakdown */}
        <div className="mt-4">
          <button
            onClick={() => setShowBreakdownDetails(!showBreakdownDetails)}
            className="w-full flex items-center justify-between"
          >
            <p className="label-micro text-[9px]">CONFIDENCE BREAKDOWN</p>
            {showBreakdownDetails ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/40" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40" />}
          </button>
          
          <div className="flex items-center gap-0.5 h-4 rounded-full overflow-hidden mt-2">
            {data.confidenceBreakdown.segments.map((seg, i) => (
              <div
                key={seg.label}
                className="h-full transition-all duration-500 relative group cursor-help"
                style={{
                  width: `${(seg.value / data.confidenceBreakdown.segments.reduce((s, ss) => s + ss.value, 0)) * 100}%`,
                  background: `hsl(${seg.color})`,
                  opacity: 0.6 + (1 - i / data.confidenceBreakdown.segments.length) * 0.4,
                }}
                title={`${seg.label}: ${(seg.value * 100).toFixed(0)}%`}
              >
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-[hsl(228,14%,5%)] border border-border/30 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                  <p className="text-[10px] font-semibold text-foreground">{seg.label}</p>
                  <p className="text-[9px] text-muted-foreground">{(seg.value * 100).toFixed(0)}%</p>
                </div>
              </div>
            ))}
          </div>

          {/* Expanded details */}
          {showBreakdownDetails && (
            <div className="mt-3 space-y-2.5 animate-slide-up" style={{ animationDuration: "200ms" }}>
              {data.confidenceBreakdown.segments.map((seg) => (
                <div key={seg.label} className="flex items-center gap-3 group">
                  <div
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ background: `hsl(${seg.color})` }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-foreground/70">{seg.label}</span>
                      <span className="text-[11px] font-mono-data text-foreground/80 font-medium">{(seg.value * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary/20 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${seg.value * 100}%`, background: `hsl(${seg.color})` }}
                      />
                    </div>
                    <p className="text-[9px] text-muted-foreground/50 mt-0.5">{seg.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── SHAP Force Plot ─── */}
      <div>
        <p className="label-micro text-[9px] mb-4">FEATURE IMPORTANCE</p>
        <div className="space-y-3">
          {data.factors.map((f) => {
            const width = (f.importance / maxImportance) * 100;
            const isPositive = f.direction === "positive";
            return (
              <div key={f.feature} className="group">
                <div className="flex items-center gap-4">
                  {/* Label */}
                  <span className="text-[12px] text-foreground/70 w-40 shrink-0 text-right">
                    {f.feature}
                  </span>

                  {/* Force bar */}
                  <div className="flex-1 flex items-center">
                    <div className="relative w-full h-9 flex items-center">
                      {/* Center line */}
                      <div className="absolute left-0 top-1/2 w-full h-px bg-border/20" />

                      {/* Bar */}
                      <div
                        className={`h-9 rounded-md transition-all duration-700 group-hover:opacity-100 opacity-75 relative ${
                          isPositive ? "bg-primary/20" : "bg-destructive/15"
                        }`}
                        style={{ width: `${width}%` }}
                      >
                        {/* Glow edge */}
                        <div
                          className={`absolute top-0 right-0 w-1 h-full rounded-r-md ${
                            isPositive ? "bg-primary/60" : "bg-destructive/50"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Value */}
                  <span className={`text-[12px] font-mono-data font-semibold w-12 text-right ${
                    isPositive ? "text-primary" : "text-destructive"
                  }`}>
                    {isPositive ? "+" : "-"}{(f.importance * 100).toFixed(0)}%
                  </span>
                </div>
                {/* Description tooltip */}
                <div className="ml-44 mt-0.5 max-h-0 overflow-hidden group-hover:max-h-20 transition-all duration-300">
                  <p className="text-[9px] text-muted-foreground/50 pl-1">{f.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 ml-44">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-primary/30" />
            <span className="text-[10px] text-muted-foreground/50">Pushes demand up</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-destructive/20" />
            <span className="text-[10px] text-muted-foreground/50">Pushes demand down</span>
          </div>
        </div>
      </div>

      {/* ─── AI Narrative ─── */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-primary/[0.03] to-accent/[0.03] border-l-2 border-primary/25">
        <div className="flex items-start gap-2 mb-3">
          <Brain className="w-4 h-4 text-primary/60 mt-0.5 shrink-0" />
          <p className="label-micro text-[9px]">AI EXPLANATION</p>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed mb-4">
          {data.narrative}
        </p>
        
        {/* Bullet-point reasons */}
        <div className="space-y-1.5 pt-3 border-t border-primary/10">
          <p className="text-[9px] text-primary/50 font-semibold uppercase tracking-wider mb-2">Key Prediction Factors</p>
          {data.naturalLanguageReasons.map((reason, i) => (
            <p key={i} className="text-[11px] text-foreground/65 leading-relaxed">{reason}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExplainView;
