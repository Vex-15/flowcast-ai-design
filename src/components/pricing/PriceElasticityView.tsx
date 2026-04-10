import { useState, useEffect, useMemo, useCallback } from "react";
import type { RetailBrainState } from "@/hooks/useRetailBrain";
import { getSKU, getBrand } from "@/data/brands";
import {
  ComposedChart, Area, Line, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
  LineChart,
} from "recharts";
import {
  TrendingDown, TrendingUp, DollarSign, Target, Zap,
  ArrowDownRight, ArrowUpRight, Shield, AlertTriangle, BarChart3,
  Calculator, ToggleLeft, ToggleRight, Info, Eye,
} from "lucide-react";

// ─── Animated Counter ──────────────────────────────────────
const AnimatedNumber = ({ value, prefix = "", suffix = "", decimals = 0, duration = 1200 }: {
  value: number; prefix?: string; suffix?: string; decimals?: number; duration?: number;
}) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(eased * value);
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return <>{prefix}{display.toFixed(decimals)}{suffix}</>;
};

// ─── Seasonal Elasticity Gauge (SVG arc) ───────────────────
const SeasonalGauge = ({ value, label }: { value: number; label: string }) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1200;
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedValue(eased * value);
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  const size = 130;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const totalAngle = 270;
  const startAngle = 135;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (totalAngle / 360) * circumference;
  const filledLength = (Math.min(animatedValue, 100) / 100) * arcLength;
  const dashOffset = arcLength - filledLength;
  const color = animatedValue > 25 ? "hsl(0 72% 51%)" : animatedValue > 15 ? "hsl(38 92% 50%)" : "hsl(152 69% 45%)";

  const polarToCartesian = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: center + radius * Math.cos(rad), y: center + radius * Math.sin(rad) };
  };
  const s = polarToCartesian(startAngle);
  const e = polarToCartesian(startAngle + totalAngle);
  const pathD = `M ${s.x} ${s.y} A ${radius} ${radius} 0 1 1 ${e.x} ${e.y}`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path d={pathD} fill="none" stroke="hsl(var(--border))" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d={pathD} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={`${arcLength}`} strokeDashoffset={dashOffset}
        style={{ transition: "stroke 0.6s ease, stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
      <text x={center} y={center - 6} textAnchor="middle" dominantBaseline="central" className="font-mono-data"
        style={{ fontSize: "26px", fontWeight: 300, fill: color, letterSpacing: "-0.04em" }}>
        {Math.round(animatedValue)}%
      </text>
      <text x={center} y={center + 16} textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: "7px", fontWeight: 600, fill: "hsl(var(--muted-foreground))", letterSpacing: "0.15em", textTransform: "uppercase" }}>
        {label}
      </text>
    </svg>
  );
};

// ─── Enhanced Tooltip ────────────────────────────────────────
const ElasticityTooltip = ({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;
  const isOptimal = data.isOptimal;
  const isCurrent = data.isCurrent;
  return (
    <div className="bg-card/95 backdrop-blur-xl border border-border/40 rounded-xl px-4 py-3 shadow-2xl min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full ${isOptimal ? "bg-emerald-400" : isCurrent ? "bg-amber-400" : "bg-primary"}`} />
        <p className="text-xs font-semibold text-foreground">${data.price.toFixed(2)}</p>
        <span className="text-[9px] text-muted-foreground/50 font-mono-data ml-auto">{(data.priceMultiplier * 100).toFixed(0)}% of current</span>
      </div>
      <div className="space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Predicted Units</span>
          <span className="font-mono-data text-primary font-medium">{data.predictedUnits.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Revenue</span>
          <span className="font-mono-data text-emerald-400 font-medium">${data.predictedRevenue.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Confidence Range</span>
          <span className="font-mono-data text-muted-foreground/70">{data.confidenceLower} – {data.confidenceUpper} units</span>
        </div>
        {data.revenueDelta !== undefined && (
          <div className="flex items-center justify-between gap-6 pt-1 border-t border-border/30">
            <span className="text-muted-foreground">Δ Revenue</span>
            <span className={`font-mono-data font-medium ${data.revenueDelta > 0 ? "text-emerald-400" : data.revenueDelta < 0 ? "text-destructive" : "text-muted-foreground"}`}>
              {data.revenueDelta > 0 ? "+" : ""}{data.revenueDelta > 999 || data.revenueDelta < -999 ? `$${(data.revenueDelta / 1000).toFixed(1)}k` : `$${Math.round(data.revenueDelta)}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Competitor Timeline Tooltip ─────────────────────────────
const CompetitorTooltip = ({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-card/95 backdrop-blur-xl border border-border/40 rounded-xl px-4 py-3 shadow-2xl min-w-[180px]">
      <p className="text-xs font-semibold text-foreground mb-2">{data.day}</p>
      <div className="space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-primary rounded-full inline-block" /> Your Price</span>
          <span className="font-mono-data text-primary font-medium">${data.yourPrice.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-amber-400 rounded-full inline-block" /> Competitor</span>
          <span className="font-mono-data text-amber-400 font-medium">${data.competitorPrice.toFixed(2)}</span>
        </div>
        {data.isUndercut && (
          <div className="flex items-center gap-1 pt-1 border-t border-border/30 text-destructive">
            <AlertTriangle className="w-3 h-3" />
            <span className="text-[10px]">Undercut by {Math.abs(data.undercutPct).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Revenue Impact Bar Tooltip ──────────────────────────────
const RevenueBarTooltip = ({ data, currentRevenue }: { data: any; currentRevenue: number }) => {
  if (!data) return null;
  const delta = data.predictedRevenue - currentRevenue;
  const pctDiff = currentRevenue > 0 ? ((delta / currentRevenue) * 100) : 0;
  return (
    <div className="bg-card/95 backdrop-blur-xl border border-border/40 rounded-xl px-3 py-2 shadow-2xl text-[10px] min-w-[160px]">
      <p className="font-semibold text-foreground mb-1">${data.price.toFixed(2)} <span className="text-muted-foreground/50 font-normal">({(data.priceMultiplier * 100).toFixed(0)}%)</span></p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Revenue</span>
          <span className="font-mono-data">${data.predictedRevenue.toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Δ vs Current</span>
          <span className={`font-mono-data ${delta >= 0 ? "text-emerald-400" : "text-destructive"}`}>
            {delta >= 0 ? "+" : ""}{delta > 999 || delta < -999 ? `$${(delta / 1000).toFixed(1)}k` : `$${Math.round(delta)}`}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">% Difference</span>
          <span className={`font-mono-data font-semibold ${pctDiff >= 0 ? "text-emerald-400" : "text-destructive"}`}>
            {pctDiff >= 0 ? "+" : ""}{pctDiff.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Microcopy helper ────────────────────────────────────────
const Microcopy = ({ text }: { text: string }) => (
  <div className="flex items-start gap-1.5 mt-1">
    <Info className="w-3 h-3 text-muted-foreground/40 shrink-0 mt-0.5" />
    <p className="text-[10px] text-muted-foreground/50 leading-relaxed">{text}</p>
  </div>
);

// ─── Main View Component ────────────────────────────────────
const PriceElasticityView = ({ brain }: { brain: RetailBrainState }) => {
  const sku = getSKU(brain.selectedSKU);
  const brand = getBrand(sku.brand);
  const elasticity = brain.elasticity;

  // ─── State: Optimization mode toggle ───
  const [optimizationMode, setOptimizationMode] = useState<"revenue" | "profit">("revenue");
  const [costPerUnit, setCostPerUnit] = useState(() => Math.round(sku.price * 0.4)); // default 40% of retail
  const [hoveredBarIdx, setHoveredBarIdx] = useState<number | null>(null);

  // Update cost when SKU changes
  useEffect(() => {
    setCostPerUnit(Math.round(sku.price * 0.4));
  }, [sku.price]);

  const labelColor: Record<string, string> = {
    "Highly Elastic": "text-destructive",
    "Elastic": "text-amber-400",
    "Unit Elastic": "text-primary",
    "Inelastic": "text-emerald-400",
  };

  const labelBg: Record<string, string> = {
    "Highly Elastic": "bg-destructive/10",
    "Elastic": "bg-amber-500/10",
    "Unit Elastic": "bg-primary/10",
    "Inelastic": "bg-emerald-500/10",
  };

  // Sweet spot calculations
  const rangeMin = sku.price * 0.7;
  const rangeMax = sku.price * 1.3;
  const rangeSpan = rangeMax - rangeMin;
  const sweetSpotLeftPct = ((elasticity.markdownSweetSpot.low - rangeMin) / rangeSpan) * 100;
  const sweetSpotWidthPct = ((elasticity.markdownSweetSpot.high - elasticity.markdownSweetSpot.low) / rangeSpan) * 100;
  const currentPricePct = ((sku.price - rangeMin) / rangeSpan) * 100;
  const optimumPricePct = ((elasticity.revenueMaxPrice - rangeMin) / rangeSpan) * 100;

  // Discount range — ensure ASCENDING order (low% to high%)
  const discountLow = ((1 - elasticity.markdownSweetSpot.high / sku.price) * 100);
  const discountHigh = ((1 - elasticity.markdownSweetSpot.low / sku.price) * 100);
  const discountMin = Math.min(discountLow, discountHigh);
  const discountMax = Math.max(discountLow, discountHigh);

  // Competitor delta
  const competitorDelta = ((elasticity.competitorAnchor - sku.price) / sku.price * 100);

  // Revenue uplift at optimum vs current
  const currentRevenue = elasticity.curve.find(p => p.priceMultiplier === 1.0)?.predictedRevenue || 0;
  const revenueUplift = currentRevenue > 0
    ? ((elasticity.revenueMaxRevenue - currentRevenue) / currentRevenue * 100)
    : 0;

  // ─── Profit optimization calculations ───
  const profitData = useMemo(() => {
    const curveWithProfit = elasticity.curve.map(pt => ({
      ...pt,
      profit: (pt.price - costPerUnit) * pt.predictedUnits,
    }));
    const profitMaxPoint = curveWithProfit.reduce((best, pt) =>
      pt.profit > best.profit ? pt : best
    , curveWithProfit[0]);
    const currentPoint = curveWithProfit.find(p => p.priceMultiplier === 1.0);
    const currentProfit = currentPoint ? currentPoint.profit : 0;
    return {
      curveWithProfit,
      profitMaxPrice: profitMaxPoint.price,
      profitMaxValue: profitMaxPoint.profit,
      profitMaxUnits: profitMaxPoint.predictedUnits,
      currentProfit,
      profitUplift: currentProfit > 0 ? ((profitMaxPoint.profit - currentProfit) / currentProfit * 100) : 0,
    };
  }, [elasticity.curve, costPerUnit]);

  // Pricing strategy recommendation
  const strategy = useMemo(() => {
    const coeff = Math.abs(elasticity.elasticityCoefficient);
    if (coeff > 1.5) return {
      action: "Aggressive Markdown",
      icon: ArrowDownRight,
      color: "text-destructive",
      bg: "bg-destructive/[0.04]",
      border: "border-destructive/15",
      desc: "Demand is highly price-sensitive. Strategic markdowns will generate outsized unit volume and net revenue gains.",
    };
    if (coeff > 1.0) return {
      action: "Strategic Discount",
      icon: TrendingDown,
      color: "text-amber-400",
      bg: "bg-amber-500/[0.04]",
      border: "border-amber-500/15",
      desc: "Moderate elasticity suggests targeted promotions during peak seasons will maximize revenue without eroding brand value.",
    };
    if (coeff > 0.8) return {
      action: "Hold Price",
      icon: Target,
      color: "text-primary",
      bg: "bg-primary/[0.04]",
      border: "border-primary/15",
      desc: "Near unit-elastic — price changes produce proportional demand shifts. Current pricing is close to optimal.",
    };
    return {
      action: "Premium Position",
      icon: Shield,
      color: "text-emerald-400",
      bg: "bg-emerald-500/[0.04]",
      border: "border-emerald-500/15",
      desc: "Inelastic demand indicates strong brand loyalty. Consider moderate price increases to improve margins without losing volume.",
    };
  }, [elasticity.elasticityCoefficient]);

  // Curve data points with enrichment
  const curveData = elasticity.curve.map(pt => ({
    ...pt,
    revenueDelta: pt.predictedRevenue - currentRevenue,
    profit: (pt.price - costPerUnit) * pt.predictedUnits,
    isOptimal: pt.price === elasticity.revenueMaxPrice,
    isCurrent: pt.priceMultiplier === 1.0,
    isProfitOptimal: pt.price === profitData.profitMaxPrice,
  }));



  // Best performing revenue range
  const bestRange = useMemo(() => {
    const sorted = [...curveData].sort((a, b) => b.predictedRevenue - a.predictedRevenue);
    const top3 = sorted.slice(0, 3).sort((a, b) => a.price - b.price);
    return { low: top3[0]?.price || 0, high: top3[top3.length - 1]?.price || 0 };
  }, [curveData]);

  // Format helpers
  const fmtCurrency = (v: number) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ─── Hero Header ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border/60 p-6">
        {/* Subtle ambient glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/[0.03] rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                style={{ background: `hsl(${brand.color} / 0.12)`, color: `hsl(${brand.color})` }}>
                {brand.name}
              </span>
              <span className="text-[10px] text-muted-foreground/30 font-mono-data">{sku.id}</span>
            </div>
            <h1 className="text-3xl font-light tracking-tight text-foreground">
              Price Elasticity <span className="font-semibold">Intelligence</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{sku.name} — demand response modeling</p>
          </div>

          {/* Elasticity Coefficient Hero */}
          <div className="text-right">
            <p className="text-6xl font-extralight font-mono-data tracking-tighter text-foreground leading-none">
              <AnimatedNumber value={elasticity.elasticityCoefficient} decimals={2} />
            </p>
            <p className="label-micro text-[8px] mt-2">ELASTICITY COEFFICIENT</p>
            <span className={`inline-block mt-2 text-[10px] font-semibold px-2.5 py-1 rounded-lg ${labelBg[elasticity.elasticityLabel]} ${labelColor[elasticity.elasticityLabel]}`}>
              {elasticity.elasticityLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Pricing Strategy Recommendation ─── */}
      <div className={`relative overflow-hidden p-5 rounded-2xl ${strategy.bg} border ${strategy.border}`}>
        <div className="absolute top-3 right-4 opacity-[0.06]">
          <strategy.icon className="w-20 h-20" />
        </div>
        <div className="relative flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${labelBg[elasticity.elasticityLabel]}`}>
            <strategy.icon className={`w-5 h-5 ${strategy.color}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <p className={`text-sm font-semibold ${strategy.color}`}>Recommended: {strategy.action}</p>
              <Zap className={`w-3 h-3 ${strategy.color}`} />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{strategy.desc}</p>
            <p className="text-xs text-muted-foreground/60 mt-2 italic">{elasticity.narrative}</p>
          </div>
        </div>
      </div>

      {/* ─── Optimization Mode Toggle + KPI Strip ─── */}
      <div className="space-y-4">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOptimizationMode(optimizationMode === "revenue" ? "profit" : "revenue")}
              className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border/60 hover:border-primary/30 transition-all duration-300"
            >
              {optimizationMode === "revenue" ? (
                <ToggleLeft className="w-5 h-5 text-primary" />
              ) : (
                <ToggleRight className="w-5 h-5 text-emerald-400" />
              )}
              <span className="text-xs font-semibold text-foreground">
                {optimizationMode === "revenue" ? "Revenue Optimization" : "Profit Optimization"}
              </span>
            </button>
            <Microcopy text={optimizationMode === "revenue"
              ? "Maximizing total revenue (price × units sold)"
              : "Maximizing profit after cost deduction ((price − cost) × units sold)"
            } />
          </div>
          {optimizationMode === "profit" && (
            <div className="flex items-center gap-2 animate-slide-up">
              <label className="text-[10px] text-muted-foreground font-medium">Cost per Unit:</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                <input
                  type="number"
                  value={costPerUnit}
                  onChange={e => setCostPerUnit(Math.max(0, Number(e.target.value)))}
                  className="w-24 pl-6 pr-2 py-1.5 text-xs font-mono-data bg-secondary/30 border border-border/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 text-foreground"
                />
              </div>
            </div>
          )}
        </div>

        {/* KPI Strip */}
        <div className={`grid ${optimizationMode === "profit" ? "grid-cols-6" : "grid-cols-5"} gap-px bg-border/20 rounded-2xl overflow-hidden`}>
          {[
            {
              label: "CURRENT PRICE", value: fmtCurrency(sku.price),
              icon: DollarSign, color: "text-foreground", subtext: sku.category,
              hint: "The current retail price for this SKU",
            },
            {
              label: optimizationMode === "revenue" ? "REVENUE-MAX PRICE" : "PROFIT-MAX PRICE",
              value: fmtCurrency(optimizationMode === "revenue" ? elasticity.revenueMaxPrice : profitData.profitMaxPrice),
              icon: Target,
              color: (optimizationMode === "revenue" ? elasticity.revenueMaxPrice : profitData.profitMaxPrice) < sku.price ? "text-emerald-400" : "text-amber-400",
              subtext: `${(optimizationMode === "revenue" ? elasticity.revenueMaxPrice : profitData.profitMaxPrice) < sku.price ? "↓" : "↑"} ${Math.abs((1 - (optimizationMode === "revenue" ? elasticity.revenueMaxPrice : profitData.profitMaxPrice) / sku.price) * 100).toFixed(1)}% ${(optimizationMode === "revenue" ? elasticity.revenueMaxPrice : profitData.profitMaxPrice) < sku.price ? "discount" : "premium"}`,
              hint: optimizationMode === "revenue" ? "Price that generates maximum total revenue" : "Price that generates maximum profit after costs",
            },
            {
              label: optimizationMode === "revenue" ? "REVENUE UPLIFT" : "PROFIT UPLIFT",
              value: fmtPct(optimizationMode === "revenue" ? revenueUplift : profitData.profitUplift),
              icon: TrendingUp,
              color: (optimizationMode === "revenue" ? revenueUplift : profitData.profitUplift) > 0 ? "text-emerald-400" : "text-muted-foreground",
              subtext: optimizationMode === "revenue"
                ? `$${elasticity.revenueMaxRevenue.toLocaleString()} at optimum`
                : `$${Math.round(profitData.profitMaxValue).toLocaleString()} max profit`,
              hint: `Potential ${optimizationMode} increase by moving to the optimal price`,
            },
            {
              label: "COMPETITOR PRICE", value: fmtCurrency(elasticity.competitorAnchor),
              icon: BarChart3,
              color: competitorDelta < 0 ? "text-amber-400" : "text-emerald-400",
              subtext: `${competitorDelta > 0 ? "+" : ""}${competitorDelta.toFixed(1)}% vs you`,
              hint: "Average competitor price for this category/SKU",
            },
            {
              label: "OPTIMAL UNITS",
              value: `${optimizationMode === "revenue" ? elasticity.revenueMaxUnits : profitData.profitMaxUnits}`,
              icon: Zap, color: "text-primary",
              subtext: `at ${fmtCurrency(optimizationMode === "revenue" ? elasticity.revenueMaxPrice : profitData.profitMaxPrice)}`,
              hint: "Predicted units sold at the optimal price point",
            },
            ...(optimizationMode === "profit" ? [{
              label: "MAX PROFIT",
              value: `$${Math.round(profitData.profitMaxValue).toLocaleString()}`,
              icon: Calculator, color: "text-emerald-400" as string,
              subtext: `cost: ${fmtCurrency(costPerUnit)}/unit`,
              hint: "Maximum achievable profit at the optimal price",
            }] : []),
          ].map((tile) => (
            <div key={tile.label} className="bg-card p-4 group hover:bg-secondary/20 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <p className="label-micro text-[8px]">{tile.label}</p>
                <tile.icon className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors" />
              </div>
              <p className={`text-2xl font-light font-mono-data tracking-tight ${tile.color} transition-colors`}>
                {tile.value}
              </p>
              <p className="text-[10px] text-muted-foreground/50 mt-1 font-mono-data">{tile.subtext}</p>
              <p className="text-[9px] text-muted-foreground/30 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">{tile.hint}</p>
            </div>
          ))}
        </div>

        {/* Revenue vs Profit Comparison Card (visible in profit mode) */}
        {optimizationMode === "profit" && (
          <div className="grid grid-cols-2 gap-4 animate-slide-up">
            <div className="rounded-xl p-4 bg-primary/[0.04] border border-primary/15">
              <p className="label-micro text-[8px] mb-2">REVENUE-MAXIMIZING</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-light font-mono-data text-primary">{fmtCurrency(elasticity.revenueMaxPrice)}</span>
                <span className="text-[10px] text-muted-foreground">→ Rev: ${elasticity.revenueMaxRevenue.toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-muted-foreground/50 mt-1">
                Profit at this price: ${Math.round((elasticity.revenueMaxPrice - costPerUnit) * elasticity.revenueMaxUnits).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl p-4 bg-emerald-500/[0.04] border border-emerald-500/15">
              <p className="label-micro text-[8px] mb-2">PROFIT-MAXIMIZING</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-light font-mono-data text-emerald-400">{fmtCurrency(profitData.profitMaxPrice)}</span>
                <span className="text-[10px] text-muted-foreground">→ Profit: ${Math.round(profitData.profitMaxValue).toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-muted-foreground/50 mt-1">
                Revenue at this price: ${Math.round(profitData.curveWithProfit.find(p => p.price === profitData.profitMaxPrice)?.predictedRevenue || 0).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Main Chart: Demand-Price Response Curve (FIXED) ─── */}
      <div className="p-6 rounded-2xl bg-card border border-border/60 surface-glow">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm font-semibold text-foreground">Demand-Price Response Curve</p>
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">13 price points from 70% to 130% of current · confidence intervals shown</p>
            <Microcopy text="This chart shows how demand (units) and revenue change as price varies. The green dashed line marks the optimal price point." />
          </div>
          <div className="flex items-center gap-5 text-[10px] text-muted-foreground/60">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-primary rounded-full inline-block" /> Demand (Units)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-emerald-500/20 border border-emerald-500/30 rounded-sm inline-block" /> Revenue ($)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-purple-500/8 border border-purple-500/15 rounded-sm inline-block" /> 90% CI
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0 border-t border-dashed border-amber-400 inline-block" style={{ width: 12 }} /> Current
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0 border-t border-dashed border-emerald-400 inline-block" style={{ width: 12 }} /> Optimal
            </span>
          </div>
        </div>
        <div style={{ height: 380 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={curveData} margin={{ top: 15, right: 40, left: 10, bottom: 25 }}>
              <defs>
                <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(265 60% 62%)" stopOpacity={0.06} />
                  <stop offset="100%" stopColor="hsl(265 60% 62%)" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(152 69% 45%)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(152 69% 45%)" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.2} vertical={false} />
              <XAxis
                dataKey="price"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickFormatter={(v: number) => `$${Math.round(v)}`}
                axisLine={{ stroke: "hsl(var(--border))", strokeOpacity: 0.3 }}
                label={{ value: "Price ($)", position: "bottom", offset: 8, style: { fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 } }}
              />
              <YAxis yAxisId="units" orientation="left"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={false} tickLine={false}
                label={{ value: "Units Sold", angle: -90, position: "insideLeft", offset: -5, style: { fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 } }}
              />
              <YAxis yAxisId="revenue" orientation="right"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                axisLine={false} tickLine={false}
                label={{ value: "Revenue ($)", angle: 90, position: "insideRight", offset: -5, style: { fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 } }}
              />
              <Tooltip content={<ElasticityTooltip />} />

              {/* Confidence band — very subtle */}
              <Area yAxisId="units" dataKey="confidenceUpper" stroke="none" fill="url(#confidenceGradient)" type="monotone" />
              <Area yAxisId="units" dataKey="confidenceLower" stroke="none" fill="hsl(var(--card))" fillOpacity={1} type="monotone" />

              {/* Revenue bars — thinner with gap */}
              <Bar yAxisId="revenue" dataKey="predictedRevenue" fill="url(#revenueGradient)" radius={[4, 4, 0, 0]} barSize={18} />

              {/* Demand line — smooth monotone curve */}
              <Line yAxisId="units" type="monotone" dataKey="predictedUnits"
                stroke="hsl(217 91% 60%)" strokeWidth={2.5}
                dot={({ cx, cy, payload }: any) => {
                  if (payload.isOptimal) return <circle key="opt" cx={cx} cy={cy} r={6} fill="hsl(152 69% 45%)" stroke="hsl(var(--card))" strokeWidth={2.5} />;
                  if (payload.isCurrent) return <circle key="cur" cx={cx} cy={cy} r={6} fill="hsl(38 92% 50%)" stroke="hsl(var(--card))" strokeWidth={2.5} />;
                  if (optimizationMode === "profit" && payload.isProfitOptimal) return <circle key="profopt" cx={cx} cy={cy} r={5} fill="hsl(280 60% 55%)" stroke="hsl(var(--card))" strokeWidth={2} />;
                  return <circle key={cx} cx={cx} cy={cy} r={2} fill="hsl(217 91% 60%)" strokeWidth={0} opacity={0.7} />;
                }}
                activeDot={{ r: 5, fill: "hsl(217 91% 60%)", stroke: "hsl(var(--card))", strokeWidth: 2 }}
              />

              {/* Reference lines */}
              <ReferenceLine yAxisId="units" x={sku.price}
                stroke="hsl(38 92% 50%)" strokeDasharray="8 5" strokeWidth={1.5}
                label={{ value: "▾ Current", position: "top", fill: "hsl(38 92% 50%)", fontSize: 9, fontWeight: 600 }}
              />
              <ReferenceLine yAxisId="units" x={elasticity.revenueMaxPrice}
                stroke="hsl(152 69% 45%)" strokeDasharray="8 5" strokeWidth={1.5}
                label={{ value: "▾ Optimum", position: "top", fill: "hsl(152 69% 45%)", fontSize: 9, fontWeight: 600 }}
              />
              {optimizationMode === "profit" && profitData.profitMaxPrice !== elasticity.revenueMaxPrice && (
                <ReferenceLine yAxisId="units" x={profitData.profitMaxPrice}
                  stroke="hsl(280 60% 55%)" strokeDasharray="5 3" strokeWidth={1.5}
                  label={{ value: "▾ Profit Max", position: "top", fill: "hsl(280 60% 55%)", fontSize: 9, fontWeight: 600 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Three-column bottom panels ─── */}
      <div className="grid grid-cols-3 gap-6">

        {/* Markdown Sweet Spot (ENHANCED) */}
        <div className="rounded-2xl p-5 bg-card border border-border/60 col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Markdown Sweet Spot</p>
              <p className="text-[10px] text-muted-foreground/50">Price range where discounts generate net revenue gain</p>
            </div>
          </div>

          {/* Explanation microcopy */}
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/[0.03] border border-emerald-500/10">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <Eye className="w-3 h-3 inline mr-1 text-emerald-400" />
              This range represents prices where discounting leads to a <span className="text-emerald-400 font-medium">net revenue gain</span> —
              the increased volume from lower prices more than compensates for the reduced per-unit revenue.
            </p>
          </div>

          {/* Gradient slider bar with zones */}
          <div className="space-y-2">
            {/* Zone labels */}
            <div className="flex justify-between items-center text-[9px] font-mono-data">
              <span className="text-destructive/60">Loss Zone</span>
              <span className="text-muted-foreground/40">Neutral</span>
              <span className="text-emerald-400/60">Profit Zone</span>
            </div>

            {/* Labels row */}
            <div className="flex justify-between text-[9px] font-mono-data text-muted-foreground/40">
              <span>${rangeMin.toFixed(0)} (70%)</span>
              <span>${rangeMax.toFixed(0)} (130%)</span>
            </div>

            {/* Track with gradient and markers */}
            <div className="relative h-10">
              {/* Base track with gradient: red → yellow → green */}
              <div className="absolute top-4 w-full h-2.5 rounded-full overflow-hidden"
                style={{
                  background: `linear-gradient(to right, 
                    hsl(0 72% 51% / 0.25) 0%, 
                    hsl(38 92% 50% / 0.2) 35%, 
                    hsl(152 69% 45% / 0.15) 50%, 
                    hsl(152 69% 45% / 0.35) 65%,
                    hsl(38 92% 50% / 0.2) 80%,
                    hsl(0 72% 51% / 0.25) 100%)`
                }}
              />
              {/* Sweet spot fill overlay */}
              <div className="absolute top-4 h-2.5 rounded-full bg-emerald-400/30 border border-emerald-400/40 transition-all duration-700"
                style={{ left: `${Math.max(0, sweetSpotLeftPct)}%`, width: `${Math.min(100 - sweetSpotLeftPct, sweetSpotWidthPct)}%` }}
              />
              {/* Current price marker */}
              <div className="absolute top-0 group cursor-pointer" style={{ left: `${currentPricePct}%`, transform: "translateX(-50%)" }}>
                <div className="w-1 h-10 bg-amber-400/70 rounded-full" />
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-amber-400 border-2 border-card shadow-sm" />
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 rounded bg-card/95 border border-border/40 text-[8px] font-mono-data whitespace-nowrap shadow-lg z-10">
                  Current: ${sku.price.toFixed(0)}
                </div>
              </div>
              {/* Optimum price marker */}
              <div className="absolute top-0 group cursor-pointer" style={{ left: `${optimumPricePct}%`, transform: "translateX(-50%)" }}>
                <div className="w-1 h-10 bg-emerald-400/80 rounded-full" />
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-emerald-400 border-2 border-card shadow-sm" />
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 rounded bg-card/95 border border-border/40 text-[8px] font-mono-data whitespace-nowrap shadow-lg z-10">
                  Optimal: ${elasticity.revenueMaxPrice.toFixed(0)}
                </div>
              </div>
            </div>

            {/* Price labels under track */}
            <div className="relative h-5">
              <div className="absolute text-[9px] font-mono-data text-amber-400 font-medium"
                style={{ left: `${currentPricePct}%`, transform: "translateX(-50%)" }}>
                ${sku.price.toFixed(0)}
              </div>
              <div className="absolute text-[9px] font-mono-data text-emerald-400 font-medium"
                style={{ left: `${optimumPricePct}%`, transform: "translateX(-50%)" }}>
                ${elasticity.revenueMaxPrice.toFixed(0)}
              </div>
            </div>
          </div>

          {/* Sweet spot details — fixed ascending discount range */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-secondary/10 border border-border/30 hover:bg-secondary/20 transition-colors">
              <p className="label-micro text-[8px] mb-1">SWEET SPOT LOW</p>
              <p className="text-lg font-light font-mono-data text-emerald-400">${elasticity.markdownSweetSpot.low.toFixed(2)}</p>
              <p className="text-[9px] text-muted-foreground/40 mt-0.5">Lower bound of optimal range</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/10 border border-border/30 hover:bg-secondary/20 transition-colors">
              <p className="label-micro text-[8px] mb-1">SWEET SPOT HIGH</p>
              <p className="text-lg font-light font-mono-data text-emerald-400">${elasticity.markdownSweetSpot.high.toFixed(2)}</p>
              <p className="text-[9px] text-muted-foreground/40 mt-0.5">Upper bound of optimal range</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/10 border border-border/30 hover:bg-secondary/20 transition-colors">
              <p className="label-micro text-[8px] mb-1">DISCOUNT RANGE</p>
              <p className="text-lg font-light font-mono-data text-foreground">
                {Math.abs(discountMin).toFixed(0)}% – {Math.abs(discountMax).toFixed(0)}%
              </p>
              <p className="text-[9px] text-muted-foreground/40 mt-0.5">Ascending discount range</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground/60 mt-3 leading-relaxed">
            Discounting within <span className="text-emerald-400 font-medium">${elasticity.markdownSweetSpot.low.toFixed(2)} – ${elasticity.markdownSweetSpot.high.toFixed(2)}</span> generates
            more total revenue than the current ${sku.price.toFixed(2)} price point due to the disproportionate demand lift.
          </p>
        </div>

        {/* Seasonal + Competitor Column */}
        <div className="space-y-6">
          {/* Seasonal Elasticity Boost */}
          <div className="rounded-2xl p-5 bg-card border border-border/60">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-accent" />
              </div>
              <p className="text-sm font-semibold text-foreground">Seasonal Boost</p>
            </div>
            <div className="flex flex-col items-center">
              <SeasonalGauge value={elasticity.seasonalElasticityBoost * 100} label="seasonal boost" />
              <p className="text-[10px] text-muted-foreground mt-2 text-center leading-relaxed">
                {sku.seasonalPeak.length > 0
                  ? <>During <span className="text-foreground font-medium">{sku.seasonalPeak.join(" & ")}</span>, demand is {(elasticity.seasonalElasticityBoost * 100).toFixed(0)}% more price-sensitive</>
                  : `Stable year-round with ${(elasticity.seasonalElasticityBoost * 100).toFixed(0)}% variation`
                }
              </p>
              <Microcopy text="Higher seasonal boost means discounts are more effective during peak periods" />
            </div>
          </div>

          {/* Competitor Position Card */}
          <div className="rounded-2xl p-5 bg-card border border-border/60">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-sm font-semibold text-foreground">Competitor Gap</p>
            </div>
            <div className="flex items-center justify-center gap-6 py-3">
              <div className="text-center">
                <p className="text-xl font-light font-mono-data text-foreground">${elasticity.competitorAnchor.toFixed(0)}</p>
                <p className="text-[9px] text-muted-foreground/50 mt-0.5">COMPETITOR</p>
              </div>
              <div className="flex flex-col items-center">
                <div className={`flex items-center gap-1 text-xs font-semibold font-mono-data ${competitorDelta < 0 ? "text-amber-400" : "text-emerald-400"}`}>
                  {competitorDelta < 0 ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                  {Math.abs(competitorDelta).toFixed(1)}%
                </div>
                <div className="w-12 h-px bg-border/40 mt-1" />
              </div>
              <div className="text-center">
                <p className="text-xl font-light font-mono-data text-foreground">${sku.price.toFixed(0)}</p>
                <p className="text-[9px] text-muted-foreground/50 mt-0.5">YOUR PRICE</p>
              </div>
            </div>
            {competitorDelta < 0 && (
              <div className="flex items-start gap-2 mt-2 p-2.5 rounded-lg bg-amber-500/[0.04] border border-amber-500/10">
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Competitor undercuts you by <span className="text-amber-400 font-medium">{Math.abs(competitorDelta).toFixed(1)}%</span>. Consider price matching in the markdown sweet spot range.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Competitor Pricing Trend (ENHANCED) ─── */}
      {elasticity.competitorTimeline && elasticity.competitorTimeline.length > 0 && (() => {
        // Pre-compute undercut zone data for area fill
        const enrichedTimeline = elasticity.competitorTimeline.map((d, i) => ({
          ...d,
          undercutZone: d.isUndercut ? d.yourPrice : null,
          undercutBaseline: d.isUndercut ? d.competitorPrice : null,
          // Detect significant price drops (>2% in a single day)
          isPriceDrop: i > 0 && (
            (elasticity.competitorTimeline[i - 1].competitorPrice - d.competitorPrice)
            / elasticity.competitorTimeline[i - 1].competitorPrice > 0.02
          ),
          priceDropPct: i > 0
            ? parseFloat((
                (elasticity.competitorTimeline[i - 1].competitorPrice - d.competitorPrice)
                / elasticity.competitorTimeline[i - 1].competitorPrice * 100
              ).toFixed(1))
            : 0,
        }));

        // Enhanced insight computation
        const firstPrice = elasticity.competitorTimeline[0].competitorPrice;
        const lastPrice = elasticity.competitorTimeline[elasticity.competitorTimeline.length - 1].competitorPrice;
        const totalChange = ((firstPrice - lastPrice) / firstPrice) * 100;
        const undercutDays = elasticity.competitorTimeline.filter(d => d.isUndercut).length;
        const totalDays = elasticity.competitorTimeline.length;
        const undercutPct = ((undercutDays / totalDays) * 100).toFixed(0);
        const avgUndercutMargin = elasticity.competitorTimeline
          .filter(d => d.isUndercut)
          .reduce((sum, d) => sum + Math.abs(d.undercutPct), 0) / Math.max(1, undercutDays);
        const priceDropEvents = enrichedTimeline.filter(d => d.isPriceDrop).length;
        const direction = totalChange > 0 ? "reduced" : "increased";
        const pressure = undercutDays > totalDays * 0.5 ? "high" : undercutDays > totalDays * 0.25 ? "moderate" : "low";
        const pressureColor = pressure === "high" ? "text-destructive" : pressure === "moderate" ? "text-amber-400" : "text-emerald-400";

        return (
          <div className="rounded-2xl p-5 bg-card border border-border/60 surface-glow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Competitor Pricing Trend</p>
                  <p className="text-[10px] text-muted-foreground/50">{totalDays}-day pricing comparison · Your price vs competitor</p>
                </div>
              </div>
              {/* Stats pills */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={`text-xs font-semibold font-mono-data ${totalChange > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                    {totalChange > 0 ? "↓" : "↑"} {Math.abs(totalChange).toFixed(1)}%
                  </p>
                  <p className="text-[9px] text-muted-foreground/40">price change</p>
                </div>
                <div className="w-px h-8 bg-border/30" />
                <div className="text-right">
                  <p className="text-xs font-semibold font-mono-data text-destructive">
                    {undercutDays} days
                  </p>
                  <p className="text-[9px] text-muted-foreground/40">undercut events</p>
                </div>
                <div className="w-px h-8 bg-border/30" />
                <div className="text-right">
                  <p className="text-xs font-semibold font-mono-data text-amber-400">
                    {priceDropEvents}
                  </p>
                  <p className="text-[9px] text-muted-foreground/40">price drops</p>
                </div>
              </div>
            </div>

            {/* Dynamic Insight banner */}
            <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-amber-500/[0.04] to-destructive/[0.04] border border-amber-500/10">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Competitor <span className="text-foreground font-medium">{direction}</span> price by{" "}
                  <span className="text-amber-400 font-semibold">{Math.abs(totalChange).toFixed(1)}%</span> over the last{" "}
                  <span className="text-foreground font-medium">{totalDays} days</span>,{" "}
                  {undercutDays > 0 ? (
                    <>
                      undercutting your price on{" "}
                      <span className="text-destructive font-semibold">{undercutDays} days ({undercutPct}%)</span>
                      {" "}by an average of <span className="text-destructive font-medium">{avgUndercutMargin.toFixed(1)}%</span>.{" "}
                    </>
                  ) : "maintaining prices above your level."}
                  Competitive pressure is <span className={`font-semibold ${pressureColor}`}>{pressure}</span>.
                </p>
              </div>
            </div>

            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={enrichedTimeline} margin={{ top: 10, right: 30, left: 10, bottom: 25 }}>
                  <defs>
                    <linearGradient id="yourPriceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="compPriceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(38 92% 50%)" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="hsl(38 92% 50%)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                    interval={4}
                    axisLine={{ stroke: "hsl(var(--border))", strokeOpacity: 0.3 }}
                    label={{ value: "Time (Days)", position: "bottom", offset: 8, style: { fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 500 } }}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    tickFormatter={(v: number) => `$${Math.round(v)}`}
                    axisLine={false} tickLine={false}
                    domain={['dataMin - 20', 'dataMax + 20']}
                    label={{ value: "Price ($)", angle: -90, position: "insideLeft", offset: -5, style: { fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 500 } }}
                  />
                  <Tooltip content={<CompetitorTooltip />} />

                  {/* Your price line — smooth monotone with subtle fill */}
                  <Line type="monotone" dataKey="yourPrice"
                    stroke="hsl(217 91% 60%)" strokeWidth={2.5}
                    dot={false} name="Your Price"
                    strokeLinecap="round"
                  />
                  {/* Competitor price line — smooth monotone */}
                  <Line type="monotone" dataKey="competitorPrice"
                    stroke="hsl(38 92% 50%)" strokeWidth={2.5}
                    dot={({ cx, cy, payload }: any) => {
                      // Highlight undercut events with red dots
                      if (payload.isUndercut) return (
                        <g key={cx}>
                          <circle cx={cx} cy={cy} r={5} fill="hsl(0 72% 51%)" fillOpacity={0.15} />
                          <circle cx={cx} cy={cy} r={3} fill="hsl(0 72% 51%)" stroke="hsl(var(--card))" strokeWidth={1.5} />
                        </g>
                      );
                      // Highlight significant price drops
                      if (payload.isPriceDrop) return (
                        <g key={cx}>
                          <circle cx={cx} cy={cy} r={5} fill="hsl(38 92% 50%)" fillOpacity={0.2} />
                          <circle cx={cx} cy={cy} r={3} fill="hsl(38 92% 50%)" stroke="hsl(var(--card))" strokeWidth={1.5} />
                        </g>
                      );
                      return <circle key={cx} cx={cx} cy={cy} r={0} />;
                    }}
                    name="Competitor"
                    strokeLinecap="round"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Enhanced Legend */}
            <div className="flex items-center justify-center gap-6 mt-3 text-[10px] text-muted-foreground/60">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-0.5 bg-primary rounded-full inline-block" /> Your Price
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-0.5 bg-amber-400 rounded-full inline-block" /> Competitor Price
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-destructive/80 inline-block" /> Undercut Event
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80 inline-block" /> Price Drop
              </span>
            </div>
          </div>
        );
      })()}

      {/* ─── Revenue Impact by Price Point (ENHANCED) ─── */}
      <div className="rounded-2xl p-5 bg-card border border-border/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Revenue Impact by Price Point</p>
              <p className="text-[10px] text-muted-foreground/50">Δ Revenue vs current price at each multiplier</p>
              <Microcopy text="Each bar shows the revenue difference compared to your current price. Green = gain, Red = loss." />
            </div>
          </div>
          {/* Summary insight */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/10">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <p className="text-[10px] text-muted-foreground">
              Best range: <span className="text-emerald-400 font-medium font-mono-data">${bestRange.low.toFixed(0)} – ${bestRange.high.toFixed(0)}</span>
            </p>
          </div>
        </div>
        <div className="grid grid-cols-13 gap-1.5">
          {curveData.map((pt, idx) => {
            const delta = pt.predictedRevenue - currentRevenue;
            const isPositive = delta > 0;
            const maxDelta = Math.max(...curveData.map(p => Math.abs(p.predictedRevenue - currentRevenue)));
            const barHeight = maxDelta > 0 ? Math.abs(delta) / maxDelta * 56 : 0;
            const pctChange = currentRevenue > 0 ? ((delta / currentRevenue) * 100) : 0;
            const isHovered = hoveredBarIdx === idx;

            return (
              <div key={pt.price} className="flex flex-col items-center relative"
                onMouseEnter={() => setHoveredBarIdx(idx)}
                onMouseLeave={() => setHoveredBarIdx(null)}
              >
                {/* Hover tooltip */}
                {isHovered && (
                  <div className="absolute -top-24 left-1/2 -translate-x-1/2 z-20">
                    <RevenueBarTooltip data={pt} currentRevenue={currentRevenue} />
                  </div>
                )}

                {/* Labels on top of bar */}
                <div className="h-7 flex flex-col items-center justify-end mb-0.5">
                  <p className={`text-[7px] font-mono-data font-semibold ${isPositive ? "text-emerald-400" : delta < 0 ? "text-destructive/80" : "text-muted-foreground/40"}`}>
                    {pctChange >= 0 ? "+" : ""}{pctChange.toFixed(0)}%
                  </p>
                </div>

                {/* Bar */}
                <div className="relative w-full h-14 flex items-end justify-center cursor-pointer">
                  <div
                    className={`w-full rounded-t-sm transition-all duration-500 ${
                      pt.isCurrent ? "bg-amber-400/50 ring-1 ring-amber-400/30" :
                      pt.isOptimal ? "bg-emerald-400/60 ring-1 ring-emerald-400/30" :
                      isPositive ? "bg-emerald-400/25 hover:bg-emerald-400/40" :
                      delta < 0 ? "bg-destructive/20 hover:bg-destructive/30" :
                      "bg-muted-foreground/10"
                    } ${isHovered ? "scale-x-110 brightness-110" : ""}`}
                    style={{ height: `${Math.max(2, barHeight)}px`, transition: "height 0.5s ease, transform 0.2s ease" }}
                  />
                  {/* Current price baseline marker */}
                  {pt.isCurrent && (
                    <div className="absolute -bottom-0 w-full h-px bg-amber-400/60" />
                  )}
                </div>

                {/* Multiplier label */}
                <p className={`text-[8px] font-mono-data mt-1 ${
                  pt.isCurrent ? "text-amber-400 font-bold" :
                  pt.isOptimal ? "text-emerald-400 font-bold" :
                  "text-muted-foreground/40"
                }`}>
                  {(pt.priceMultiplier * 100).toFixed(0)}%
                </p>

                {/* Delta label */}
                <p className={`text-[7px] font-mono-data ${isPositive ? "text-emerald-400" : delta < 0 ? "text-destructive/70" : "text-muted-foreground/30"}`}>
                  {isPositive ? "+" : ""}{delta > 999 || delta < -999
                    ? `${(delta / 1000).toFixed(0)}k`
                    : Math.round(delta)}
                </p>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-6 mt-3 text-[9px] text-muted-foreground/40">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400/50 inline-block" /> Current Price</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400/60 inline-block" /> Revenue Optimum</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400/25 inline-block" /> Revenue Gain</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-destructive/20 inline-block" /> Revenue Loss</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-muted-foreground/10 inline-block" /> Neutral</span>
        </div>
      </div>
    </div>
  );
};

export default PriceElasticityView;
