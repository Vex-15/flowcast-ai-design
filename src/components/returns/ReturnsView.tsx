import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell,
} from "recharts";
import {
  Ghost, Wrench, Shield, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Minus, AlertTriangle, Info,
  Brain, Target,
} from "lucide-react";
import type { ReturnAnalysis, Explanation } from "@/data/types";

const trendIcons = { up: TrendingUp, down: TrendingDown, stable: Minus };

const ReturnsView = ({
  data,
  skuName,
  returnExplanation,
}: {
  data: ReturnAnalysis;
  skuName: string;
  returnExplanation?: Explanation;
}) => {
  const [showExplainability, setShowExplainability] = useState(false);
  const [showRiskFactors, setShowRiskFactors] = useState(true);

  const riskColor = data.riskScore > 60
    ? "text-destructive" : data.riskScore > 35
    ? "text-amber-400" : "text-emerald-400";
  const riskBg = data.riskScore > 60
    ? "bg-destructive/10" : data.riskScore > 35
    ? "bg-amber-500/10" : "bg-emerald-500/10";
  const riskGlow = data.riskScore > 60
    ? "glow-destructive" : "";
  const riskLabelColor = data.riskLabel === "High"
    ? "text-white bg-red-500/80" : data.riskLabel === "Medium"
    ? "text-white bg-amber-500/80" : "text-white bg-emerald-500/80";

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
          <div className="flex items-center gap-3">
            <div>
              <p className={`text-5xl font-extralight tracking-tighter font-mono-data leading-none ${riskColor}`}>
                {data.riskScore}
                <span className="text-lg text-muted-foreground/30 ml-0.5">/100</span>
              </p>
              <p className="label-micro text-[9px] mt-1">RETURN RISK SCORE</p>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${riskLabelColor}`}>
              {data.riskLabel} Risk
            </span>
          </div>
        </div>
      </div>

      {/* ─── AI Explanation Banner ─── */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-primary/[0.04] to-accent/[0.04] border-l-2 border-primary/25">
        <div className="flex items-start gap-2">
          <Brain className="w-4 h-4 text-primary/60 mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] text-primary/60 font-semibold uppercase tracking-wider mb-1">AI EXPLANATION</p>
            <p className="text-[12px] text-foreground/80 leading-relaxed">
              {data.returnExplanation}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Three-metric strip ─── */}
      <div className="grid grid-cols-4 gap-px bg-border/20 rounded-xl overflow-hidden">
        <div className="bg-card p-4">
          <p className="text-2xl font-light font-mono-data text-foreground tracking-tight">
            {(data.returnRate * 100).toFixed(1)}%
          </p>
          <p className="label-micro text-[8px] mt-1">RETURN RATE</p>
        </div>
        <div className="bg-card p-4">
          <p className="text-2xl font-light font-mono-data text-muted-foreground tracking-tight">
            {(data.categoryAvgReturn * 100).toFixed(1)}%
          </p>
          <p className="label-micro text-[8px] mt-1">CATEGORY AVG</p>
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
        {/* ─── LEFT: Return Risk Factors (SHAP-like) ─── */}
        <div>
          <button
            onClick={() => setShowRiskFactors(!showRiskFactors)}
            className="w-full flex items-center justify-between mb-3"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-primary/50" />
              <p className="label-micro text-[9px]">RISK FACTOR ANALYSIS</p>
            </div>
            {showRiskFactors ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/40" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40" />}
          </button>
          
          {showRiskFactors && (
            <div className="space-y-2.5">
              {data.riskFactors.map((factor) => {
                const isRisk = factor.direction === "increases_risk";
                const impactColor = factor.impact === "high" ? "text-destructive" : factor.impact === "medium" ? "text-amber-400" : "text-emerald-400";
                const barColor = isRisk
                  ? "bg-gradient-to-r from-destructive/20 to-destructive/5"
                  : "bg-gradient-to-r from-emerald-500/20 to-emerald-500/5";
                return (
                  <div key={factor.name} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${isRisk ? "bg-destructive/60" : "bg-emerald-500/60"}`} />
                        <span className="text-[11px] text-foreground/70">{factor.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold uppercase ${impactColor}`}>{factor.impact}</span>
                        <span className="text-[10px] font-mono-data text-muted-foreground">{(factor.weight * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="w-full h-7 rounded-md overflow-hidden bg-secondary/20 relative">
                      <div
                        className={`h-full rounded-md transition-all duration-700 group-hover:opacity-100 opacity-80 ${barColor}`}
                        style={{ width: `${factor.weight * 100}%` }}
                      />
                      <div className="absolute inset-0 flex items-center px-2">
                        <span className="text-[9px] font-mono-data text-foreground/50">{factor.value}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Legend */}
              <div className="flex items-center gap-4 mt-2 pt-2 border-t border-border/10">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-destructive/20" />
                  <span className="text-[9px] text-muted-foreground/50">Increases risk</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20" />
                  <span className="text-[9px] text-muted-foreground/50">Reduces risk</span>
                </div>
              </div>
            </div>
          )}

          {/* ─── Return Trend Chart ─── */}
          <div className="mt-5">
            <p className="label-micro text-[9px] mb-3">6-MONTH RETURN TREND</p>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.historicalTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(0 72% 51%)" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="hsl(0 72% 51%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 12% 14%)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: "hsl(220 10% 36%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "hsl(220 10% 36%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(225 15% 9%)", border: "1px solid hsl(225 12% 16%)", borderRadius: "10px", fontSize: "11px" }}
                    formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, "Return Rate"]}
                  />
                  <Area type="monotone" dataKey="rate" stroke="hsl(0 72% 51%)" strokeWidth={2} fill="url(#trendGrad)" dot={{ fill: "hsl(0 72% 51%)", r: 3, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Reasons + Phantom + Fixes ─── */}
        <div className="space-y-5">
          {/* Reason Heat Bars */}
          <div>
            <p className="label-micro text-[9px] mb-3">RETURN REASONS</p>
            <div className="space-y-2">
              {data.reasons.map((r) => {
                const intensity = r.percentage / maxPct;
                const TrendIcon = trendIcons[r.trend];
                const trendColor = r.trend === "up" ? "text-destructive" : r.trend === "down" ? "text-emerald-400" : "text-muted-foreground/40";
                return (
                  <div key={r.reason} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-foreground/70 truncate max-w-[200px]">{r.reason}</span>
                        <TrendIcon className={`w-3 h-3 ${trendColor}`} />
                      </div>
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
                      <div className="absolute inset-0 flex items-center px-2">
                        <span className="text-[10px] font-mono-data text-foreground/60">{r.count} returns</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Phantom Demand */}
          <div className="p-4 rounded-xl bg-secondary/20">
            <div className="flex items-center gap-2 mb-3">
              <Ghost className="w-4 h-4 text-accent/60" />
              <p className="text-xs font-semibold text-foreground">Phantom Demand Correction</p>
            </div>
            <div className="font-mono-data text-xs text-muted-foreground mb-3 leading-relaxed">
              <span className="text-emerald-400">True</span> = <span className="text-primary">{data.reportedDemand}</span> − (<span className="text-amber-400">{(data.returnRate * 100).toFixed(1)}%</span> × <span className="text-primary">{data.reportedDemand}</span>) = <span className="text-emerald-400 font-semibold">{data.trueDemand}</span>
            </div>
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

      {/* ─── Expandable Explainability Section ─── */}
      {returnExplanation && (
        <div>
          <button
            onClick={() => setShowExplainability(!showExplainability)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-primary/[0.03] to-accent/[0.03] border border-primary/10 hover:border-primary/20 transition-all"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary/60" />
              <span className="text-xs text-foreground font-medium">Model Explainability — Why This Prediction?</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono-data text-primary">
                Confidence: {(returnExplanation.confidence * 100).toFixed(0)}%
              </span>
              {showExplainability ? <ChevronUp className="w-4 h-4 text-muted-foreground/40" /> : <ChevronDown className="w-4 h-4 text-muted-foreground/40" />}
            </div>
          </button>

          {showExplainability && (
            <div className="mt-3 p-5 rounded-xl bg-card border border-border/20 space-y-4 animate-slide-up" style={{ animationDuration: "200ms" }}>
              {/* Natural language reasons */}
              <div>
                <p className="label-micro text-[9px] mb-2">PREDICTION FACTORS</p>
                <div className="space-y-1.5">
                  {returnExplanation.naturalLanguageReasons.map((reason, i) => (
                    <p key={i} className="text-[11px] text-foreground/70 leading-relaxed pl-1">{reason}</p>
                  ))}
                </div>
              </div>

              {/* Feature importance bars */}
              <div>
                <p className="label-micro text-[9px] mb-2">FEATURE IMPORTANCE</p>
                <div className="space-y-2">
                  {returnExplanation.factors.map((f) => {
                    const maxImp = Math.max(...returnExplanation.factors.map(ff => ff.importance));
                    const width = (f.importance / maxImp) * 100;
                    const isPositive = f.direction === "positive";
                    return (
                      <div key={f.feature} className="flex items-center gap-3">
                        <span className="text-[10px] text-foreground/60 w-32 shrink-0 text-right">{f.feature}</span>
                        <div className="flex-1 h-5 rounded bg-secondary/10 overflow-hidden">
                          <div
                            className={`h-full rounded transition-all duration-500 ${isPositive ? "bg-primary/25" : "bg-destructive/20"}`}
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-mono-data w-10 text-right ${isPositive ? "text-primary" : "text-destructive"}`}>
                          {isPositive ? "+" : "-"}{(f.importance * 100).toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Confidence breakdown */}
              <div>
                <p className="label-micro text-[9px] mb-2">CONFIDENCE BREAKDOWN</p>
                <div className="grid grid-cols-5 gap-2">
                  {returnExplanation.confidenceBreakdown.segments.map((seg) => (
                    <div key={seg.label} className="text-center">
                      <div className="relative w-full h-2 rounded-full bg-secondary/30 overflow-hidden mb-1.5">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${seg.value * 100}%`, background: `hsl(${seg.color})` }}
                        />
                      </div>
                      <p className="text-[9px] font-mono-data text-foreground/70">{(seg.value * 100).toFixed(0)}%</p>
                      <p className="text-[8px] text-muted-foreground/40 truncate">{seg.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReturnsView;
