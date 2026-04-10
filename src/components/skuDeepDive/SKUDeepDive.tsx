import { useState, useEffect, useMemo } from "react";
import type { RetailBrainState } from "@/hooks/useRetailBrain";
import type { SKUTab } from "@/data/types";
import { getBrand } from "@/data/brands";
import { skuCatalog } from "@/data/brands";
import { generateDemandForecast } from "@/data/generators";
import {
  Package, AlertTriangle, MapPin, Tag, ArrowRight,
  TrendingUp, TrendingDown, Award, LayoutDashboard, BarChart3, FlaskConical, Radio, Heart
} from "lucide-react";

import DemandView from "@/components/demand/DemandView";
import AnomalyPanel from "@/components/demand/AnomalyPanel";
import SignalsView from "@/components/signals/SignalsView";
import InventoryView from "@/components/inventory/InventoryView";
import SimulationView from "@/components/simulation/SimulationView";
import RegistryDemandView from "@/components/skuDeepDive/RegistryDemandView";

// ─── SKU Health Score computation ──────────────────────────
function computeHealthScore(brain: RetailBrainState): number {
  const inv = brain.inventoryDecision;

  // 1. Stockout risk (0–1, higher = worse → invert)
  const stockoutContrib = (1 - inv.stockoutRisk) * 35;

  // 2. Signal confidence (0–1, higher = better)
  const signalContrib = brain.signalFusion.combinedConfidence * 35;

  // 3. Anomaly penalty
  let anomalyContrib = 30;
  const hasCritical = brain.anomalies.some((a) => a.severity === "critical");
  const hasWarning = brain.anomalies.some((a) => a.severity === "warning");
  if (hasCritical) anomalyContrib -= 15;
  else if (hasWarning) anomalyContrib -= 7;

  const raw = stockoutContrib + signalContrib + anomalyContrib;
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
    let frame: number;
    const start = performance.now();
    const duration = 1200;
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
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

  const totalAngle = 270;
  const startAngle = 135;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (totalAngle / 360) * circumference;
  const filledLength = (animatedScore / 100) * arcLength;
  const dashOffset = arcLength - filledLength;

  const color = getHealthColor(animatedScore);

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
        <path d={pathD} fill="none" stroke="hsl(var(--border))" strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d={pathD} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={`${arcLength}`} strokeDashoffset={dashOffset} style={{ transition: "stroke 0.6s ease" }} />
        <text x={center} y={center - 4} textAnchor="middle" dominantBaseline="central" className="font-mono-data" style={{ fontSize: "36px", fontWeight: 300, fill: color, letterSpacing: "-0.04em" }}>{animatedScore}</text>
        <text x={center} y={center + 22} textAnchor="middle" dominantBaseline="central" style={{ fontSize: "8px", fontWeight: 600, fill: "hsl(var(--muted-foreground))", letterSpacing: "0.15em", textTransform: "uppercase" }}>SKU HEALTH</text>
        <text x={center} y={size - 12} textAnchor="middle" dominantBaseline="central" style={{ fontSize: "10px", fontWeight: 600, fill: color }}>{getHealthLabel(animatedScore)}</text>
      </svg>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────
const SKUDeepDive = ({ brain }: { brain: RetailBrainState }) => {
  const sku = brain.currentSKU;
  const brand = getBrand(sku.brand);
  const inv = brain.inventoryDecision;

  const healthScore = useMemo(() => computeHealthScore(brain), [brain]);

  // Product Performance metrics
  const totalPredicted = useMemo(() => brain.forecast.reduce((s, f) => s + f.predicted, 0), [brain.forecast]);
  const avgDailyPredicted = totalPredicted / brain.forecast.length;
  const revenueVelocity = sku.price * avgDailyPredicted;
  const sellThroughRate = (totalPredicted / (inv.currentStock + totalPredicted)) * 100;

  const velocityRank = useMemo(() => {
    const allTotals = skuCatalog.map((s) => {
      const fc = generateDemandForecast(s.id, 14);
      return { id: s.id, total: fc.reduce((sum, f) => sum + f.predicted, 0) };
    });
    allTotals.sort((a, b) => b.total - a.total);
    const rank = allTotals.findIndex((x) => x.id === sku.id) + 1;
    return { rank, total: allTotals.length };
  }, [sku.id]);

  const revTrend = useMemo(() => {
    if (brain.forecast.length < 14) return 0;
    const first7 = brain.forecast.slice(0, 7).reduce((s, f) => s + f.predicted, 0);
    const last7 = brain.forecast.slice(7, 14).reduce((s, f) => s + f.predicted, 0);
    return first7 > 0 ? ((last7 - first7) / first7) * 100 : 0;
  }, [brain.forecast]);

  const showRegistryTab = sku.seasonalPeak.some(p => ["wedding", "holiday", "baby"].includes(p)) || brain.registryDemand.activeRegistries > 3;

  const tabs: { id: SKUTab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "predictive-demand", label: "Predictive Demand", icon: BarChart3 },
    { id: "orchestration", label: "Inventory Orchestration", icon: FlaskConical },
    ...(showRegistryTab ? [{ id: "registry" as SKUTab, label: "Registry Demand", icon: Heart }] : []),
  ];

  const renderOverview = () => (
    <div className="space-y-6 animate-slide-up">
      {/* ─── SKU Health Score + Quick Stats ─── */}
      <div className="p-5 rounded-2xl bg-card border border-border/15">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="shrink-0"><HealthGauge score={healthScore} /></div>
          
          {/* Quick Stats Grid without returns */}
          <div className="flex-1 grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-secondary/10 border border-border/10">
              <p className="text-3xl font-light font-mono-data text-foreground tracking-tight">{inv.currentStock}</p>
              <p className="label-micro text-[8px] mt-1">UNITS IN STOCK</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/10 border border-border/10">
              <p className={`text-3xl font-light font-mono-data tracking-tight ${inv.stockoutRisk > 0.5 ? "text-destructive" : "text-emerald-400"}`}>{(inv.stockoutRisk * 100).toFixed(0)}%</p>
              <p className="label-micro text-[8px] mt-1">STOCKOUT RISK</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/10 border border-border/10">
              <p className="text-3xl font-light font-mono-data text-foreground tracking-tight">{sku.stores.length}</p>
              <p className="label-micro text-[8px] mt-1">ACTIVE STORES</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border/15">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-semibold text-foreground">Product Performance</p>
            <span className="text-[10px] text-muted-foreground/40">14-day forecast window</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-secondary/10 border border-border/10">
              <div className="flex items-center justify-between mb-2">
                <span className="label-micro text-[8px]">REVENUE VELOCITY</span>
                <div className={`flex items-center gap-0.5 text-[10px] font-mono-data font-semibold ${revTrend >= 0 ? "text-emerald-400" : "text-destructive"}`}>
                  {revTrend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(revTrend).toFixed(1)}%
                </div>
              </div>
              <p className="text-2xl font-light font-mono-data text-foreground tracking-tight">${revenueVelocity.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <p className="text-[10px] text-muted-foreground/40 mt-1">est. daily revenue</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/10 border border-border/10">
              <span className="label-micro text-[8px]">SELL-THROUGH RATE</span>
              <div className="mt-2 mb-1"><p className="text-2xl font-light font-mono-data text-foreground tracking-tight">{sellThroughRate.toFixed(1)}%</p></div>
              <div className="w-full h-2 bg-secondary/20 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, sellThroughRate)}%`, background: sellThroughRate > 70 ? "hsl(142 71% 45%)" : sellThroughRate > 40 ? "hsl(38 92% 50%)" : "hsl(0 72% 51%)" }} />
              </div>
            </div>
            <div className="p-4 rounded-xl bg-secondary/10 border border-border/10">
              <span className="label-micro text-[8px]">MARGIN CONTRIBUTION</span>
              <p className="text-2xl font-light font-mono-data text-emerald-400 tracking-tight mt-2">34.2%</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/10 border border-border/10">
              <span className="label-micro text-[8px]">VELOCITY RANK</span>
              <div className="flex items-center gap-2 mt-2"><Award className="w-5 h-5 text-amber-400" /><p className="text-2xl font-light font-mono-data text-foreground tracking-tight">#{velocityRank.rank}</p></div>
            </div>
          </div>
        </div>

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
                    <span className={`text-xl font-light font-mono-data tracking-tight ${item.color}`}>{item.value}</span>
                  </div>
                ))}
                <div className="border-t border-border/15 pt-3 flex items-center justify-between">
                  <span className="label-micro text-[8px]">TOTAL</span>
                  <span className="text-2xl font-semibold font-mono-data text-foreground tracking-tighter">{latest.total}</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (brain.activeTab) {
      case "predictive-demand":
        return (
          <div className="space-y-6 animate-slide-up bg-background">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <DemandView forecast={brain.forecast} decomposition={brain.decomposition} skuName={brain.currentSKU.name} />
              </div>
              <div className="space-y-6">
                <AnomalyPanel anomalies={brain.anomalies} intent={brain.intentAcceleration} />
              </div>
            </div>
            {/* Bring Signals into Predictive Demand */}
            <div className="mt-6 border-t border-border/20 pt-6">
              <h3 className="text-lg font-light tracking-tight text-foreground mb-4 flex items-center gap-2">
                <Radio className="w-5 h-5 text-primary" /> Multi-Agent Signal Fusion
              </h3>
              <p className="text-xs text-muted-foreground mb-6">Why is this forecasting happening? Analyzing external data streams.</p>
              <SignalsView fusion={brain.signalFusion} intent={brain.intentAcceleration} />
            </div>
          </div>
        );
      case "orchestration":
        return (
          <div className="space-y-6 animate-slide-up bg-background">
            <InventoryView data={brain.inventoryDecision} skuName={brain.currentSKU.name} />
            {/* Bring Simulation into Orchestration */}
            <div className="mt-8 border-t border-border/20 pt-6">
              <SimulationView params={brain.simParams} onParamsChange={brain.setSimParams} result={brain.simulation} skuName={brain.currentSKU.name} />
            </div>
          </div>
        );
      case "registry":
        return <RegistryDemandView brain={brain} />;
      case "overview":
      default:
        return renderOverview();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border/15 pt-6 px-6 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: `hsl(${brand.color} / 0.12)`, color: `hsl(${brand.color})` }}>{brand.name}</span>
          <span className="text-[10px] text-muted-foreground/30 font-mono-data">{sku.id}</span>
        </div>
        <h1 className="text-3xl font-light tracking-tight text-foreground">{sku.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">{sku.category} · <span className="font-mono-data">${sku.price.toLocaleString()}</span></p>
        
        <div className="mt-8 flex items-center overflow-x-auto no-scrollbar gap-2">
          {tabs.map((tab) => {
            const isActive = brain.activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => brain.setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 transition-all 
                  ${isActive ? "border-primary text-foreground font-medium bg-primary/[0.03]" : "border-transparent text-muted-foreground/70 hover:text-foreground hover:bg-secondary/20"}`}
              >
                <tab.icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground/50"}`} />
                <span className="text-[13px]">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>{renderActiveTab()}</div>
    </div>
  );
};

export default SKUDeepDive;
