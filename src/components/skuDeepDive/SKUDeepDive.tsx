import { useState, useEffect, useMemo } from "react";
import type { RetailBrainState } from "@/hooks/useRetailBrain";
import { getBrand } from "@/data/brands";
import { skuCatalog } from "@/data/brands";
import { generateDemandForecast } from "@/data/generators";
import {
  Package, AlertTriangle, Undo2, MapPin, Tag, ArrowRight,
  TrendingUp, TrendingDown, Award,
} from "lucide-react";

// ─── SKU Health Score computation ──────────────────────────
function computeHealthScore(brain: RetailBrainState): number {
  const inv = brain.inventoryDecision;
  const ret = brain.returnAnalysis;

  // 1. Stockout risk (0–1, higher = worse → invert)
  const stockoutContrib = (1 - inv.stockoutRisk) * 25;

  // 2. Return risk score (0–100, higher = worse → invert)
  const returnContrib = (1 - ret.riskScore / 100) * 25;

  // 3. Signal confidence (0–1, higher = better)
  const signalContrib = brain.signalFusion.combinedConfidence * 25;

  // 4. Anomaly penalty
  let anomalyContrib = 25;
  const hasCritical = brain.anomalies.some((a) => a.severity === "critical");
  const hasWarning = brain.anomalies.some((a) => a.severity === "warning");
  if (hasCritical) anomalyContrib -= 15;
  else if (hasWarning) anomalyContrib -= 7;

  const raw = stockoutContrib + returnContrib + signalContrib + anomalyContrib;
  return Math.round(Math.max(0, Math.min(100, raw)));
}

function getHealthColor(score: number): string {
  if (score <= 40) return "hsl(0 72% 51%)";   // red
  if (score <= 69) return "hsl(38 92% 50%)";   // amber
  return "hsl(142 71% 45%)";                    // emerald
}

function getHealthLabel(score: number): string {
  if (score <= 40) return "Critical";
  if (score <= 69) return "Moderate";
  return "Healthy";
}

// ─── Radial Arc Gauge (SVG) ────────────────────────────────
const HealthGauge = ({ score }: { score: number }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Animate from 0 to target score
    let frame: number;
    const start = performance.now();
    const duration = 1200;
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedScore(Math.round(eased * score));
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const size = 160;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // Arc sweeps 270 degrees (start at 135°, end at 405° = 45°)
  const totalAngle = 270;
  const startAngle = 135;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (totalAngle / 360) * circumference;
  const filledLength = (animatedScore / 100) * arcLength;
  const dashOffset = arcLength - filledLength;

  const color = getHealthColor(animatedScore);

  // Convert polar to cartesian for the arc start point
  const polarToCartesian = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  };

  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(startAngle + totalAngle);
  const largeArc = totalAngle > 180 ? 1 : 0;

  const pathD = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <path
          d={pathD}
          fill="none"
          stroke="hsl(225 12% 14%)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Animated fill */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength}`}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke 0.6s ease" }}
        />
        {/* Score number centered */}
        <text
          x={center}
          y={center - 4}
          textAnchor="middle"
          dominantBaseline="central"
          className="font-mono-data"
          style={{
            fontSize: "36px",
            fontWeight: 300,
            fill: color,
            letterSpacing: "-0.04em",
          }}
        >
          {animatedScore}
        </text>
        {/* Label below number */}
        <text
          x={center}
          y={center + 22}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontSize: "8px",
            fontWeight: 600,
            fill: "hsl(220 10% 45%)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          SKU HEALTH
        </text>
        {/* Status label at bottom */}
        <text
          x={center}
          y={size - 12}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontSize: "10px",
            fontWeight: 600,
            fill: color,
          }}
        >
          {getHealthLabel(animatedScore)}
        </text>
      </svg>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────
const SKUDeepDive = ({ brain }: { brain: RetailBrainState }) => {
  const sku = brain.currentSKU;
  const brand = getBrand(sku.brand);
  const inv = brain.inventoryDecision;
  const ret = brain.returnAnalysis;

  const healthScore = useMemo(() => computeHealthScore(brain), [brain]);

  // Product Performance metrics
  const totalPredicted = useMemo(
    () => brain.forecast.reduce((s, f) => s + f.predicted, 0),
    [brain.forecast]
  );
  const avgDailyPredicted = totalPredicted / brain.forecast.length;
  const revenueVelocity = sku.price * avgDailyPredicted;

  // Sell-through rate
  const sellThroughRate = (totalPredicted / (inv.currentStock + totalPredicted)) * 100;

  // Velocity Rank: rank this SKU among all SKUs by total predicted units
  const velocityRank = useMemo(() => {
    const allTotals = skuCatalog.map((s) => {
      const fc = generateDemandForecast(s.id, 14);
      return { id: s.id, total: fc.reduce((sum, f) => sum + f.predicted, 0) };
    });
    allTotals.sort((a, b) => b.total - a.total);
    const rank = allTotals.findIndex((x) => x.id === sku.id) + 1;
    return { rank, total: allTotals.length };
  }, [sku.id]);

  // Revenue velocity trend (compare first 7 to last 7 days of forecast)
  const revTrend = useMemo(() => {
    if (brain.forecast.length < 14) return 0;
    const first7 = brain.forecast.slice(0, 7).reduce((s, f) => s + f.predicted, 0);
    const last7 = brain.forecast.slice(7, 14).reduce((s, f) => s + f.predicted, 0);
    return first7 > 0 ? ((last7 - first7) / first7) * 100 : 0;
  }, [brain.forecast]);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ─── Product Header ─── */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
            style={{ background: `hsl(${brand.color} / 0.12)`, color: `hsl(${brand.color})` }}
          >
            {brand.name}
          </span>
          <span className="text-[10px] text-muted-foreground/30 font-mono-data">{sku.id}</span>
        </div>
        <h1 className="text-3xl font-light tracking-tight text-foreground">{sku.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {sku.category} · <span className="font-mono-data">${sku.price.toLocaleString()}</span>
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          <Tag className="w-3 h-3 text-muted-foreground/30" />
          {sku.seasonalPeak.map((s) => (
            <span key={s} className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/[0.06] text-amber-400/70 border border-amber-500/10">
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* ─── SKU Health Score + Quick Stats ─── */}
      <div className="p-5 rounded-2xl bg-card border border-border/15">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Health Gauge */}
          <div className="shrink-0">
            <HealthGauge score={healthScore} />
          </div>

          {/* Quick Stats 2×2 Grid */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-secondary/10 border border-border/10">
              <p className="text-3xl font-light font-mono-data text-foreground tracking-tight">{inv.currentStock}</p>
              <p className="label-micro text-[8px] mt-1">UNITS IN STOCK</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/10 border border-border/10">
              <p className={`text-3xl font-light font-mono-data tracking-tight ${
                inv.stockoutRisk > 0.5 ? "text-destructive" : "text-emerald-400"
              }`}>{(inv.stockoutRisk * 100).toFixed(0)}%</p>
              <p className="label-micro text-[8px] mt-1">STOCKOUT RISK</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/10 border border-border/10">
              <p className={`text-3xl font-light font-mono-data tracking-tight ${
                ret.returnRate > 0.1 ? "text-amber-400" : "text-foreground"
              }`}>{(ret.returnRate * 100).toFixed(1)}%</p>
              <p className="label-micro text-[8px] mt-1">RETURN RATE</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/10 border border-border/10">
              <p className="text-3xl font-light font-mono-data text-foreground tracking-tight">{sku.stores.length}</p>
              <p className="label-micro text-[8px] mt-1">ACTIVE STORES</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Product Performance Panel (replaces sparkline) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border/15">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-semibold text-foreground">Product Performance</p>
            <span className="text-[10px] text-muted-foreground/40">14-day forecast window</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Revenue Velocity */}
            <div className="p-4 rounded-xl bg-secondary/10 border border-border/10">
              <div className="flex items-center justify-between mb-2">
                <span className="label-micro text-[8px]">REVENUE VELOCITY</span>
                <div className={`flex items-center gap-0.5 text-[10px] font-mono-data font-semibold ${
                  revTrend >= 0 ? "text-emerald-400" : "text-destructive"
                }`}>
                  {revTrend >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(revTrend).toFixed(1)}%
                </div>
              </div>
              <p className="text-2xl font-light font-mono-data text-foreground tracking-tight">
                ${revenueVelocity.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-[10px] text-muted-foreground/40 mt-1">est. daily revenue</p>
            </div>

            {/* Sell-Through Rate */}
            <div className="p-4 rounded-xl bg-secondary/10 border border-border/10">
              <span className="label-micro text-[8px]">SELL-THROUGH RATE</span>
              <div className="mt-2 mb-1">
                <p className="text-2xl font-light font-mono-data text-foreground tracking-tight">
                  {sellThroughRate.toFixed(1)}%
                </p>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 bg-secondary/20 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, sellThroughRate)}%`,
                    background: sellThroughRate > 70
                      ? "hsl(142 71% 45%)"
                      : sellThroughRate > 40
                        ? "hsl(38 92% 50%)"
                        : "hsl(0 72% 51%)",
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground/40 mt-1.5">predicted / (stock + predicted)</p>
            </div>

            {/* Margin Contribution */}
            <div className="p-4 rounded-xl bg-secondary/10 border border-border/10">
              <span className="label-micro text-[8px]">MARGIN CONTRIBUTION</span>
              <p className="text-2xl font-light font-mono-data text-emerald-400 tracking-tight mt-2">
                34.2%
              </p>
              <p className="text-[10px] text-muted-foreground/40 mt-1">category gross margin</p>
            </div>

            {/* Velocity Rank */}
            <div className="p-4 rounded-xl bg-secondary/10 border border-border/10">
              <span className="label-micro text-[8px]">VELOCITY RANK</span>
              <div className="flex items-center gap-2 mt-2">
                <Award className="w-5 h-5 text-amber-400" />
                <p className="text-2xl font-light font-mono-data text-foreground tracking-tight">
                  #{velocityRank.rank}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground/40 mt-1">
                of {velocityRank.total} SKUs by predicted units
              </p>
            </div>
          </div>
        </div>

        {/* Decomposition pill */}
        <div className="p-5 rounded-2xl bg-card border border-border/15">
          <p className="text-sm font-semibold text-foreground mb-4">Decomposition</p>
          {(() => {
            const latest = brain.decomposition[brain.decomposition.length - 1];
            return (
              <div className="space-y-4">
                {[
                  { label: "BASE", value: latest.base, color: "text-primary" },
                  { label: "FESTIVAL", value: `+${latest.festivalBoost}`, color: "text-amber-400" },
                  { label: "PROMO", value: `+${latest.promotionBoost}`, color: "text-emerald-400" },
                  { label: "WEATHER", value: latest.weatherImpact >= 0 ? `+${latest.weatherImpact}` : `${latest.weatherImpact}`, color: "text-cyan-400" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="label-micro text-[8px]">{item.label}</span>
                    <span className={`text-xl font-light font-mono-data tracking-tight ${item.color}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
                <div className="border-t border-border/15 pt-3 flex items-center justify-between">
                  <span className="label-micro text-[8px]">TOTAL</span>
                  <span className="text-2xl font-semibold font-mono-data text-foreground tracking-tighter">
                    {latest.total}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ─── Bottom Row: Signals + Returns + Inventory ─── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Signal Confidence */}
        <div className="p-5 rounded-2xl bg-card border border-border/15">
          <p className="text-sm font-semibold text-foreground mb-4">Signal Confidence</p>
          {brain.signalFusion.signals.slice(0, 4).map((s) => (
            <div key={s.name} className="flex items-center gap-2 mb-2.5">
              <span className="text-[11px] text-foreground/60 w-28 truncate">{s.name}</span>
              <div className="flex-1 h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${s.value * 100}%`,
                    background: s.type === "internal" ? "hsl(217 91% 60%)" : "hsl(265 60% 62%)",
                  }}
                />
              </div>
              <span className="text-[10px] font-mono-data text-muted-foreground w-8 text-right">{(s.value * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>

        {/* Return snapshot */}
        <div className="p-5 rounded-2xl bg-card border border-border/15">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-foreground">Returns</p>
            <span className={`text-[10px] font-mono-data font-semibold ${ret.riskScore > 50 ? "text-destructive" : "text-muted-foreground"}`}>
              Risk {ret.riskScore}/100
            </span>
          </div>
          <div className="space-y-2">
            {ret.reasons.slice(0, 3).map((r) => (
              <div key={r.reason} className="flex items-center gap-2">
                <div className="flex-1 h-5 rounded bg-secondary/20 overflow-hidden relative">
                  <div
                    className="h-full rounded bg-destructive/15"
                    style={{ width: `${r.percentage}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-2 text-[10px] text-foreground/50 truncate">
                    {r.reason}
                  </span>
                </div>
                <span className="text-[10px] font-mono-data text-muted-foreground w-8 text-right">{r.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory snapshot */}
        <div className="p-5 rounded-2xl bg-card border border-border/15">
          <p className="text-sm font-semibold text-foreground mb-4">Inventory</p>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-light font-mono-data text-foreground tracking-tighter">{inv.reorderQty}</span>
            <span className="text-xs text-muted-foreground/40">units to reorder</span>
          </div>
          <div className="space-y-1.5">
            {inv.storeBreakdown.slice(0, 4).map((s) => (
              <div key={s.storeId} className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  s.status === "critical" ? "bg-destructive animate-pulse" :
                  s.status === "low" ? "bg-amber-400" : "bg-emerald-400"
                }`} />
                <span className="text-[11px] text-foreground/60 flex-1 truncate">{s.storeName}</span>
                <span className="text-[10px] font-mono-data text-muted-foreground">{s.stock}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SKUDeepDive;
