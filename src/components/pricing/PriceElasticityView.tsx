import { useState, useEffect, useMemo } from "react";
import type { RetailBrainState } from "@/hooks/useRetailBrain";
import { getSKU, getBrand } from "@/data/brands";
import {
  ComposedChart, Area, Line, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";
import {
  TrendingDown, TrendingUp, DollarSign, Target, Zap,
  ArrowDownRight, ArrowUpRight, Shield, AlertTriangle, BarChart3,
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

// ─── Custom Tooltip ────────────────────────────────────────
const ElasticityTooltip = ({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;
  const isOptimal = data.priceMultiplier < 1.0;
  return (
    <div className="bg-card/95 backdrop-blur-xl border border-border/40 rounded-xl px-4 py-3 shadow-2xl">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-1.5 h-1.5 rounded-full ${isOptimal ? "bg-emerald-400" : "bg-amber-400"}`} />
        <p className="text-xs font-semibold text-foreground">${data.price.toFixed(2)}</p>
        <span className="text-[9px] text-muted-foreground/50 font-mono-data">{(data.priceMultiplier * 100).toFixed(0)}%</span>
      </div>
      <div className="space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Predicted Units</span>
          <span className="font-mono-data text-primary font-medium">{data.predictedUnits}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Revenue</span>
          <span className="font-mono-data text-emerald-400 font-medium">${data.predictedRevenue.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">CI Range</span>
          <span className="font-mono-data text-muted-foreground/70">{data.confidenceLower} – {data.confidenceUpper}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Main View Component ────────────────────────────────────
const PriceElasticityView = ({ brain }: { brain: RetailBrainState }) => {
  const sku = getSKU(brain.selectedSKU);
  const brand = getBrand(sku.brand);
  const elasticity = brain.elasticity;

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

  // Competitor delta
  const competitorDelta = ((elasticity.competitorAnchor - sku.price) / sku.price * 100);

  // Revenue uplift at optimum vs current
  const currentRevenue = elasticity.curve.find(p => p.priceMultiplier === 1.0)?.predictedRevenue || 0;
  const revenueUplift = currentRevenue > 0
    ? ((elasticity.revenueMaxRevenue - currentRevenue) / currentRevenue * 100)
    : 0;

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
    isOptimal: pt.price === elasticity.revenueMaxPrice,
    isCurrent: pt.priceMultiplier === 1.0,
  }));

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

      {/* ─── KPI Strip — 5 tiles with icons ─── */}
      <div className="grid grid-cols-5 gap-px bg-border/20 rounded-2xl overflow-hidden">
        {[
          {
            label: "CURRENT PRICE", value: `$${sku.price.toLocaleString()}`,
            icon: DollarSign, color: "text-foreground", subtext: sku.category,
          },
          {
            label: "REVENUE-MAX PRICE", value: `$${elasticity.revenueMaxPrice.toFixed(2)}`,
            icon: Target,
            color: elasticity.revenueMaxPrice < sku.price ? "text-emerald-400" : "text-amber-400",
            subtext: `${elasticity.revenueMaxPrice < sku.price ? "↓" : "↑"} ${Math.abs((1 - elasticity.revenueMaxPrice / sku.price) * 100).toFixed(1)}% ${elasticity.revenueMaxPrice < sku.price ? "discount" : "premium"}`,
          },
          {
            label: "REVENUE UPLIFT", value: `+${revenueUplift.toFixed(1)}%`,
            icon: TrendingUp, color: revenueUplift > 0 ? "text-emerald-400" : "text-muted-foreground",
            subtext: `$${elasticity.revenueMaxRevenue.toLocaleString()} at optimum`,
          },
          {
            label: "COMPETITOR PRICE", value: `$${elasticity.competitorAnchor.toFixed(2)}`,
            icon: BarChart3,
            color: competitorDelta < 0 ? "text-amber-400" : "text-emerald-400",
            subtext: `${competitorDelta > 0 ? "+" : ""}${competitorDelta.toFixed(1)}% vs you`,
          },
          {
            label: "OPTIMAL UNITS", value: `${elasticity.revenueMaxUnits}`,
            icon: Zap, color: "text-primary",
            subtext: `at $${elasticity.revenueMaxPrice.toFixed(2)}`,
          },
        ].map((tile) => (
          <div key={tile.label} className="bg-card p-4 group hover:bg-secondary/20 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="label-micro text-[8px]">{tile.label}</p>
              <tile.icon className="w-3.5 h-3.5 text-muted-foreground/30" />
            </div>
            <p className={`text-2xl font-light font-mono-data tracking-tight ${tile.color}`}>
              {tile.value}
            </p>
            <p className="text-[10px] text-muted-foreground/50 mt-1 font-mono-data">{tile.subtext}</p>
          </div>
        ))}
      </div>

      {/* ─── Main Chart: Elasticity Curve ─── */}
      <div className="p-6 rounded-2xl bg-card border border-border/60 surface-glow">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm font-semibold text-foreground">Demand-Price Response Curve</p>
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">13 price points from 70% to 130% of current · confidence intervals shown</p>
          </div>
          <div className="flex items-center gap-5 text-[10px] text-muted-foreground/60">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-primary rounded-full inline-block" /> Predicted Units
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-emerald-500/20 border border-emerald-500/30 rounded-sm inline-block" /> Revenue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-purple-500/10 border border-purple-500/20 rounded-sm inline-block" /> 90% CI
            </span>
          </div>
        </div>
        <div className="-mx-6" style={{ height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={curveData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(265 60% 62%)" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="hsl(265 60% 62%)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(152 69% 45%)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(152 69% 45%)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.25} />
              <XAxis
                dataKey="price"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickFormatter={(v: number) => `$${Math.round(v)}`}
                axisLine={{ stroke: "hsl(var(--border))", strokeOpacity: 0.3 }}
              />
              <YAxis yAxisId="units" orientation="left"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={false} tickLine={false}
                label={{ value: "Units", angle: -90, position: "insideLeft", style: { fill: "hsl(var(--muted-foreground))", fontSize: 9, opacity: 0.4 } }}
              />
              <YAxis yAxisId="revenue" orientation="right"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                axisLine={false} tickLine={false}
              />
              <Tooltip content={<ElasticityTooltip />} />

              {/* Confidence band */}
              <Area yAxisId="units" dataKey="confidenceUpper" stroke="none" fill="url(#confidenceGradient)" type="monotone" />
              <Area yAxisId="units" dataKey="confidenceLower" stroke="none" fill="hsl(var(--card))" fillOpacity={1} type="monotone" />

              {/* Revenue bars */}
              <Bar yAxisId="revenue" dataKey="predictedRevenue" fill="url(#revenueGradient)" radius={[3, 3, 0, 0]} />

              {/* Units line */}
              <Line yAxisId="units" type="monotone" dataKey="predictedUnits"
                stroke="hsl(217 91% 60%)" strokeWidth={2.5}
                dot={({ cx, cy, payload }: any) => {
                  if (payload.isOptimal) return <circle key="opt" cx={cx} cy={cy} r={6} fill="hsl(152 69% 45%)" stroke="hsl(var(--card))" strokeWidth={2} />;
                  if (payload.isCurrent) return <circle key="cur" cx={cx} cy={cy} r={6} fill="hsl(38 92% 50%)" stroke="hsl(var(--card))" strokeWidth={2} />;
                  return <circle key={cx} cx={cx} cy={cy} r={2.5} fill="hsl(217 91% 60%)" strokeWidth={0} />;
                }}
                activeDot={{ r: 5, fill: "hsl(217 91% 60%)", stroke: "hsl(var(--card))", strokeWidth: 2 }}
              />

              {/* Reference lines */}
              <ReferenceLine yAxisId="units" x={sku.price}
                stroke="hsl(38 92% 50%)" strokeDasharray="6 4" strokeWidth={1.5}
                label={{ value: "Current", position: "top", fill: "hsl(38 92% 50%)", fontSize: 10, fontWeight: 600 }}
              />
              <ReferenceLine yAxisId="units" x={elasticity.revenueMaxPrice}
                stroke="hsl(152 69% 45%)" strokeDasharray="6 4" strokeWidth={1.5}
                label={{ value: "Optimum", position: "top", fill: "hsl(152 69% 45%)", fontSize: 10, fontWeight: 600 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Three-column bottom panels ─── */}
      <div className="grid grid-cols-3 gap-6">

        {/* Markdown Sweet Spot */}
        <div className="rounded-2xl p-5 bg-card border border-border/60 col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Markdown Sweet Spot</p>
              <p className="text-[10px] text-muted-foreground/50">Price range where discounts generate net revenue gain</p>
            </div>
          </div>

          {/* Visual price range bar */}
          <div className="space-y-2">
            {/* Labels row */}
            <div className="flex justify-between text-[9px] font-mono-data text-muted-foreground/40">
              <span>${rangeMin.toFixed(0)} (70%)</span>
              <span>${rangeMax.toFixed(0)} (130%)</span>
            </div>

            {/* Track with markers */}
            <div className="relative h-8">
              {/* Base track */}
              <div className="absolute top-3 w-full h-2 rounded-full bg-secondary/30" />
              {/* Sweet spot fill */}
              <div className="absolute top-3 h-2 rounded-full bg-gradient-to-r from-emerald-500/30 to-emerald-400/50 transition-all duration-700"
                style={{ left: `${Math.max(0, sweetSpotLeftPct)}%`, width: `${Math.min(100 - sweetSpotLeftPct, sweetSpotWidthPct)}%` }}
              />
              {/* Current price marker */}
              <div className="absolute top-0" style={{ left: `${currentPricePct}%`, transform: "translateX(-50%)" }}>
                <div className="w-0.5 h-8 bg-amber-400/60" />
              </div>
              {/* Optimum price marker */}
              <div className="absolute top-0" style={{ left: `${optimumPricePct}%`, transform: "translateX(-50%)" }}>
                <div className="w-0.5 h-8 bg-emerald-400/80" />
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

          {/* Sweet spot details */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-secondary/10 border border-border/30">
              <p className="label-micro text-[8px] mb-1">SWEET SPOT LOW</p>
              <p className="text-lg font-light font-mono-data text-emerald-400">${elasticity.markdownSweetSpot.low.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/10 border border-border/30">
              <p className="label-micro text-[8px] mb-1">SWEET SPOT HIGH</p>
              <p className="text-lg font-light font-mono-data text-emerald-400">${elasticity.markdownSweetSpot.high.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/10 border border-border/30">
              <p className="label-micro text-[8px] mb-1">DISCOUNT RANGE</p>
              <p className="text-lg font-light font-mono-data text-foreground">
                {((1 - elasticity.markdownSweetSpot.low / sku.price) * 100).toFixed(0)}–{((1 - elasticity.markdownSweetSpot.high / sku.price) * 100).toFixed(0)}%
              </p>
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

      {/* ─── Revenue Impact Curve Table ─── */}
      <div className="rounded-2xl p-5 bg-card border border-border/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Revenue Impact by Price Point</p>
              <p className="text-[10px] text-muted-foreground/50">Δ Revenue vs current price at each multiplier</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-13 gap-1">
          {curveData.map((pt) => {
            const delta = pt.predictedRevenue - currentRevenue;
            const isPositive = delta > 0;
            const maxDelta = Math.max(...curveData.map(p => Math.abs(p.predictedRevenue - currentRevenue)));
            const barHeight = maxDelta > 0 ? Math.abs(delta) / maxDelta * 48 : 0;

            return (
              <div key={pt.price} className="flex flex-col items-center">
                {/* Bar */}
                <div className="relative w-full h-12 flex items-end justify-center">
                  <div
                    className={`w-full rounded-t-sm transition-all duration-500 ${
                      pt.isCurrent ? "bg-amber-400/40" :
                      pt.isOptimal ? "bg-emerald-400/50" :
                      isPositive ? "bg-emerald-400/20" : "bg-destructive/15"
                    }`}
                    style={{ height: `${barHeight}px` }}
                  />
                </div>
                {/* Multiplier label */}
                <p className={`text-[8px] font-mono-data mt-1 ${
                  pt.isCurrent ? "text-amber-400 font-bold" :
                  pt.isOptimal ? "text-emerald-400 font-bold" :
                  "text-muted-foreground/40"
                }`}>
                  {(pt.priceMultiplier * 100).toFixed(0)}%
                </p>
                {/* Delta value */}
                <p className={`text-[8px] font-mono-data ${isPositive ? "text-emerald-400" : "text-destructive/70"}`}>
                  {isPositive ? "+" : ""}{delta > 999 || delta < -999
                    ? `${(delta / 1000).toFixed(0)}k`
                    : Math.round(delta)}
                </p>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-6 mt-3 text-[9px] text-muted-foreground/40">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400/40 inline-block" /> Current Price</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400/50 inline-block" /> Revenue Optimum</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400/20 inline-block" /> Revenue Gain</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-destructive/15 inline-block" /> Revenue Loss</span>
        </div>
      </div>
    </div>
  );
};

export default PriceElasticityView;
