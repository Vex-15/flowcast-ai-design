import type {
  ForecastPoint, DemandDecomposition, AnomalyEvent,
  SignalFusionResult, SignalSource, IntentAccelerationResult, IntentSignal,
  ReturnAnalysis, ReturnReason,
  InventoryDecision, StoreInventory,
  SimulationParams, SimulationResult,
  Explanation, FeatureImportance,
  OrchestrationAlert, SKUPriority, KPI,
} from "./types";
import { getSKU, getStore, skuCatalog, stores } from "./brands";

// ─── Seeded random ────────────────────────────────────────
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ─── Demand Forecast ──────────────────────────────────────
export function generateDemandForecast(skuId: string, days = 14): ForecastPoint[] {
  const rng = seeded(hashStr(skuId + "forecast"));
  const sku = getSKU(skuId);
  const basePrice = sku.price;
  const baseDemand = Math.max(8, Math.round(200 - basePrice * 0.08 + rng() * 30));
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return Array.from({ length: days }, (_, i) => {
    const dayName = dayNames[i % 7];
    const weekendBoost = (i % 7 >= 5) ? 1.3 : 1.0;
    const trend = 1 + (i * 0.01);
    const noise = 0.9 + rng() * 0.2;
    const predicted = Math.round(baseDemand * weekendBoost * trend * noise);
    const upper = Math.round(predicted * (1.1 + rng() * 0.08));
    const lower = Math.round(predicted * (0.85 + rng() * 0.05));
    const actual = i < days - 3
      ? Math.round(predicted * (0.88 + rng() * 0.24))
      : undefined;

    const month = 4; // April
    const dayNum = 10 + i;
    return {
      day: dayName,
      date: `Apr ${dayNum}`,
      actual,
      predicted,
      lower,
      upper,
    };
  });
}

// ─── Demand Decomposition ─────────────────────────────────
export function generateDemandDecomposition(skuId: string, days = 7): DemandDecomposition[] {
  const rng = seeded(hashStr(skuId + "decomp"));
  const sku = getSKU(skuId);
  const baseDemand = Math.max(15, Math.round(180 - sku.price * 0.07 + rng() * 20));
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hasFestival = sku.seasonalPeak.includes("holiday") || sku.seasonalPeak.includes("spring");

  return dayLabels.slice(0, days).map((label, i) => {
    const base = Math.round(baseDemand * (0.85 + rng() * 0.3));
    const festivalBoost = hasFestival ? Math.round(base * (0.1 + rng() * 0.2)) : Math.round(base * rng() * 0.05);
    const promotionBoost = (i === 4 || i === 5) ? Math.round(base * (0.08 + rng() * 0.12)) : Math.round(base * rng() * 0.03);
    const weatherImpact = Math.round((rng() - 0.5) * base * 0.1);
    return {
      label,
      base,
      festivalBoost,
      promotionBoost,
      weatherImpact,
      total: base + festivalBoost + promotionBoost + weatherImpact,
    };
  });
}

// ─── Anomaly Detection ────────────────────────────────────
export function generateAnomalies(skuId: string): AnomalyEvent[] {
  const rng = seeded(hashStr(skuId + "anomaly"));
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const anomalies: AnomalyEvent[] = [];

  days.forEach((day, i) => {
    if (rng() > 0.65) {
      const isSpike = rng() > 0.4;
      const predicted = Math.round(80 + rng() * 60);
      const dev = isSpike ? (1.3 + rng() * 0.7) : (0.3 + rng() * 0.3);
      const actual = Math.round(predicted * dev);
      const zScore = Math.abs((actual - predicted) / (predicted * 0.15));
      anomalies.push({
        id: `${skuId}-anom-${i}`,
        day,
        type: isSpike ? "spike" : "drop",
        predicted,
        actual,
        deviation: parseFloat(zScore.toFixed(2)),
        severity: zScore > 3 ? "critical" : zScore > 2 ? "warning" : "info",
      });
    }
  });
  return anomalies;
}

// ─── Signal Fusion ────────────────────────────────────────
export function generateSignalFusion(skuId: string): SignalFusionResult {
  const rng = seeded(hashStr(skuId + "signal"));
  const sku = getSKU(skuId);

  const signals: SignalSource[] = [
    {
      name: "Sales Velocity",
      type: "internal",
      value: parseFloat((0.5 + rng() * 0.5).toFixed(2)),
      trend: rng() > 0.5 ? "up" : "stable",
      description: "7-day sales velocity vs 30-day average",
    },
    {
      name: "Inventory Turnover",
      type: "internal",
      value: parseFloat((0.3 + rng() * 0.6).toFixed(2)),
      trend: rng() > 0.6 ? "up" : rng() > 0.3 ? "stable" : "down",
      description: "Current stock turn rate against target",
    },
    {
      name: "Social Trend",
      type: "external",
      value: parseFloat((0.2 + rng() * 0.7).toFixed(2)),
      trend: rng() > 0.4 ? "up" : "stable",
      description: "Pinterest/Instagram mention velocity",
    },
    {
      name: "Search Volume",
      type: "external",
      value: parseFloat((0.3 + rng() * 0.6).toFixed(2)),
      trend: rng() > 0.5 ? "up" : "stable",
      description: "Google Trends search interest 7-day delta",
    },
    {
      name: "Seasonal Pattern",
      type: "external",
      value: parseFloat((0.2 + rng() * 0.8).toFixed(2)),
      trend: sku.seasonalPeak.length > 0 ? "up" : "stable",
      description: "Historical seasonal demand pattern match",
    },
    {
      name: "Event Overlap",
      type: "external",
      value: parseFloat((rng() * 0.9).toFixed(2)),
      trend: rng() > 0.6 ? "up" : "stable",
      description: "Upcoming local/national event correlation",
    },
  ];

  const weights = [0.25, 0.15, 0.2, 0.15, 0.15, 0.1];
  const combined = signals.reduce((sum, s, i) => sum + s.value * weights[i], 0);
  const combinedConfidence = parseFloat(Math.min(0.99, combined + rng() * 0.1).toFixed(2));

  const topSignals = signals
    .filter((s) => s.value > 0.5)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);

  const narrative = topSignals.length > 0
    ? `Demand ${combinedConfidence > 0.7 ? "spike" : "shift"} likely due to ${topSignals
        .map((s) => s.name.toLowerCase())
        .join(" + ")}${sku.seasonalPeak.length > 0 ? " + seasonal peak" : ""}`
    : "No significant demand signals detected — stable outlook";

  return { combinedConfidence, signals, narrative };
}

// ─── Intent Acceleration ──────────────────────────────────
export function generateIntentAcceleration(skuId: string): IntentAccelerationResult {
  const rng = seeded(hashStr(skuId + "intent"));

  const metrics: IntentSignal[] = [
    {
      metric: "Product Saves",
      current: Math.round(200 + rng() * 800),
      previous: Math.round(150 + rng() * 500),
      changePercent: 0,
      trending: "stable",
    },
    {
      metric: "Page Views",
      current: Math.round(2000 + rng() * 8000),
      previous: Math.round(1800 + rng() * 6000),
      changePercent: 0,
      trending: "stable",
    },
    {
      metric: "Avg Dwell Time",
      current: parseFloat((20 + rng() * 40).toFixed(1)),
      previous: parseFloat((18 + rng() * 35).toFixed(1)),
      changePercent: 0,
      trending: "stable",
    },
  ];

  metrics.forEach((m) => {
    m.changePercent = parseFloat((((m.current - m.previous) / m.previous) * 100).toFixed(1));
    m.trending = m.changePercent > 10 ? "up" : m.changePercent < -5 ? "down" : "stable";
  });

  const avgChange = metrics.reduce((s, m) => s + m.changePercent, 0) / metrics.length;
  const spikePredicted = avgChange > 15;
  const confidence = parseFloat(Math.min(0.95, Math.max(0.1, avgChange / 50 + 0.3 + rng() * 0.15)).toFixed(2));

  return {
    signals: metrics,
    spikePredicted,
    confidence,
    timeToSpike: spikePredicted ? `~${Math.round(1 + rng() * 3)} days` : "N/A",
  };
}

// ─── Return Intelligence ──────────────────────────────────
const returnReasonPool = [
  "Color mismatch with listing",
  "Size/dimension confusion",
  "Quality below expectation",
  "Late delivery — no longer needed",
  "Wrong item received",
  "Damaged during shipping",
  "Fabric texture different than expected",
  "Assembly difficulty",
  "Doesn't match room decor",
  "Found better price elsewhere",
];

export function generateReturnAnalysis(skuId: string): ReturnAnalysis {
  const rng = seeded(hashStr(skuId + "return"));
  const sku = getSKU(skuId);
  const returnRate = parseFloat((sku.returnRiskBase + rng() * 0.08).toFixed(3));
  const riskScore = Math.min(100, Math.round(returnRate * 500 + rng() * 15));

  const numReasons = 3 + Math.floor(rng() * 3);
  const shuffled = [...returnReasonPool].sort(() => rng() - 0.5);
  let remaining = 100;
  const reasons: ReturnReason[] = shuffled.slice(0, numReasons).map((reason, i) => {
    const pct = i < numReasons - 1
      ? Math.round(remaining * (0.2 + rng() * 0.4))
      : remaining;
    remaining -= pct;
    remaining = Math.max(0, remaining);
    return {
      reason,
      percentage: pct,
      count: Math.round(pct * (2 + rng() * 5)),
      trend: rng() > 0.6 ? "up" : rng() > 0.3 ? "stable" : "down",
    };
  });
  reasons.sort((a, b) => b.percentage - a.percentage);

  const reportedDemand = Math.round(100 + rng() * 200);
  const phantomDemandGap = Math.round(reportedDemand * returnRate);
  const trueDemand = reportedDemand - phantomDemandGap;

  const fixes: string[] = [];
  if (reasons.some((r) => r.reason.includes("Color"))) fixes.push("Improve product photography with true-to-life color calibration");
  if (reasons.some((r) => r.reason.includes("Size"))) fixes.push("Add detailed dimension guide with room-scale visualization");
  if (reasons.some((r) => r.reason.includes("Quality"))) fixes.push("Update product description to set accurate expectation");
  if (reasons.some((r) => r.reason.includes("Assembly"))) fixes.push("Include video assembly guide and improve instruction clarity");
  if (reasons.some((r) => r.reason.includes("Fabric"))) fixes.push("Add fabric swatch samples or AR texture preview");
  if (fixes.length === 0) fixes.push("Continue monitoring — return rate within acceptable range");

  return {
    skuId,
    returnRate,
    riskScore,
    reasons,
    suggestedFixes: fixes,
    phantomDemandGap,
    trueDemand,
    reportedDemand,
  };
}

// ─── Inventory Decisions ──────────────────────────────────
export function generateInventoryDecision(skuId: string): InventoryDecision {
  const rng = seeded(hashStr(skuId + "inventory"));
  const sku = getSKU(skuId);
  const avgDailyDemand = Math.max(3, Math.round(60 - sku.price * 0.02 + rng() * 20));
  const currentStock = Math.round(avgDailyDemand * (3 + rng() * 18));
  const daysUntilStockout = Math.max(0, Math.round(currentStock / avgDailyDemand));
  const stockoutRisk = parseFloat(Math.min(1, Math.max(0, 1 - daysUntilStockout / 21)).toFixed(2));
  const overstockRisk = parseFloat(Math.min(1, Math.max(0, (daysUntilStockout - 14) / 21)).toFixed(2));

  const reorderQty = daysUntilStockout < 10
    ? Math.round(avgDailyDemand * 14 * (1 + rng() * 0.2))
    : Math.round(avgDailyDemand * 7);

  const explanation: string[] = [];
  if (stockoutRisk > 0.6) explanation.push(`High stockout risk — only ${daysUntilStockout} days supply remaining`);
  if (sku.seasonalPeak.length > 0) explanation.push(`Seasonal demand peak expected (${sku.seasonalPeak.join(", ")})`);
  if (rng() > 0.5) explanation.push("Rising intent signals detected — saves and views trending up");
  if (rng() > 0.6) explanation.push(`Low inventory across ${Math.round(1 + rng() * 3)} stores`);
  explanation.push(`Reorder ${reorderQty} units to maintain ${14}-day safety stock`);

  const storeBreakdown: StoreInventory[] = sku.stores.map((storeId) => {
    const r = seeded(hashStr(storeId + skuId));
    const stock = Math.round(currentStock / sku.stores.length * (0.3 + r() * 1.4));
    const ds = Math.max(0, Math.round(stock / (avgDailyDemand / sku.stores.length)));
    return {
      storeId,
      storeName: getStore(storeId).name,
      stock,
      daysSupply: ds,
      status: ds < 3 ? "critical" : ds < 7 ? "low" : ds > 21 ? "overstock" : "ok",
    };
  });

  return {
    skuId,
    currentStock,
    reorderQty,
    daysUntilStockout,
    stockoutRisk,
    overstockRisk,
    explanation,
    storeBreakdown,
  };
}

// ─── What-If Simulation ───────────────────────────────────
export function simulateWhatIf(skuId: string, params: SimulationParams): SimulationResult {
  const rng = seeded(hashStr(skuId + "sim" + JSON.stringify(params)));
  const sku = getSKU(skuId);
  const baseDailyDemand = Math.max(5, Math.round(60 - sku.price * 0.02 + rng() * 15));
  const baseStock = Math.round(baseDailyDemand * 14);

  const effectiveDemand = baseDailyDemand
    * params.demandMultiplier
    * (params.festivalActive ? 1.3 : 1.0)
    * (1 + params.promotionIntensity / 200);

  const returnAdj = 1 - (params.returnRateAdj / 100 * sku.returnRiskBase);
  const adjDemand = effectiveDemand * returnAdj;

  let runningStock = baseStock;
  const timeline: { day: string; stock: number; demand: number }[] = [];
  let stockoutDay: number | null = null;

  for (let i = 0; i < 21; i++) {
    const dailyDemand = Math.round(adjDemand * (0.85 + rng() * 0.3));
    runningStock = Math.max(0, runningStock - dailyDemand);
    timeline.push({
      day: `Day ${i + 1}`,
      stock: runningStock,
      demand: dailyDemand,
    });
    if (runningStock === 0 && stockoutDay === null) stockoutDay = i + 1;
  }

  const baseRevenue = baseDailyDemand * sku.price * 21;
  const simRevenue = Math.round(adjDemand * sku.price * 21);

  const storeImpacts = sku.stores.slice(0, 4).map((sid) => {
    const r2 = seeded(hashStr(sid + skuId + "simstore"));
    const ds = Math.max(0, Math.round(14 / params.demandMultiplier * (0.5 + r2() * 1.0)));
    return {
      store: getStore(sid).name,
      status: ds < 3 ? "Critical" : ds < 7 ? "Low" : "OK",
      daysSupply: ds,
    };
  });

  return {
    stockoutTimeline: timeline,
    revenueImpact: simRevenue,
    revenueDelta: simRevenue - baseRevenue,
    stockoutDay,
    storeImpacts,
  };
}

// ─── Explainability ───────────────────────────────────────
export function generateExplanation(skuId: string, context: string = "forecast"): Explanation {
  const rng = seeded(hashStr(skuId + "explain" + context));
  const sku = getSKU(skuId);

  const allFeatures: FeatureImportance[] = [
    { feature: "Historical Sales Trend", importance: parseFloat((0.15 + rng() * 0.25).toFixed(2)), direction: "positive" },
    { feature: "Seasonal Pattern",       importance: parseFloat((0.1 + rng() * 0.2).toFixed(2)),  direction: "positive" },
    { feature: "Promotion Active",       importance: parseFloat((0.05 + rng() * 0.15).toFixed(2)), direction: "positive" },
    { feature: "Festival Proximity",     importance: parseFloat((rng() * 0.2).toFixed(2)),         direction: rng() > 0.3 ? "positive" : "negative" },
    { feature: "Social Signal Strength", importance: parseFloat((rng() * 0.15).toFixed(2)),        direction: "positive" },
    { feature: "Weather Forecast",       importance: parseFloat((rng() * 0.1).toFixed(2)),         direction: rng() > 0.5 ? "positive" : "negative" },
    { feature: "Return Rate History",    importance: parseFloat((0.05 + rng() * 0.1).toFixed(2)),  direction: "negative" },
    { feature: "Competitor Pricing",     importance: parseFloat((rng() * 0.08).toFixed(2)),        direction: rng() > 0.5 ? "positive" : "negative" },
  ];

  allFeatures.sort((a, b) => b.importance - a.importance);
  const top = allFeatures.slice(0, 5);

  const confidence = parseFloat((0.75 + rng() * 0.2).toFixed(2));

  const topPositive = top.filter((f) => f.direction === "positive").slice(0, 2);
  const topNegative = top.filter((f) => f.direction === "negative").slice(0, 1);

  let narrative = `Forecast for ${sku.name} is driven primarily by ${topPositive.map((f) => f.feature.toLowerCase()).join(" and ")}`;
  if (topNegative.length > 0) {
    narrative += `, with ${topNegative[0].feature.toLowerCase()} partially offsetting growth`;
  }
  narrative += `. Model confidence: ${(confidence * 100).toFixed(0)}%.`;

  return {
    summary: `${context === "forecast" ? "Demand prediction" : "Risk assessment"} for ${sku.name}`,
    factors: top,
    confidence,
    narrative,
  };
}

// ─── Orchestrator Alerts ──────────────────────────────────
export function generateAlerts(): OrchestrationAlert[] {
  const rng = seeded(42);
  const alerts: OrchestrationAlert[] = [];
  const types: OrchestrationAlert["type"][] = ["stockout", "spike", "return_anomaly", "overstock", "intent_signal"];
  const severities: OrchestrationAlert["severity"][] = ["critical", "warning", "info"];

  const messages: Record<OrchestrationAlert["type"], string[]> = {
    stockout: [
      "Projected stockout in {d} days at current sell-through rate",
      "Critical low inventory — only {s} units remaining across all stores",
    ],
    spike: [
      "Demand surge detected — {p}% above 7-day rolling average",
      "Anomalous sales velocity — possible viral event trigger",
    ],
    return_anomaly: [
      "Return rate spiked to {r}% — 'color mismatch' is top reason",
      "Unusual return pattern — {c} returns in last 48 hours",
    ],
    overstock: [
      "Overstock risk — {s} units exceed 30-day projected demand",
      "Slow-moving inventory alert — {d} days of excess supply",
    ],
    intent_signal: [
      "Product saves up {p}% — demand spike predicted in ~{d} days",
      "Dwell time + page views accelerating — pre-spike pattern detected",
    ],
  };

  skuCatalog.slice(0, 15).forEach((sku) => {
    if (rng() > 0.4) {
      const type = types[Math.floor(rng() * types.length)];
      const sev = rng() > 0.7 ? "critical" : rng() > 0.4 ? "warning" : "info";
      const msgPool = messages[type];
      let msg = msgPool[Math.floor(rng() * msgPool.length)];
      msg = msg
        .replace("{d}", String(Math.round(1 + rng() * 6)))
        .replace("{s}", String(Math.round(10 + rng() * 200)))
        .replace("{p}", String(Math.round(20 + rng() * 60)))
        .replace("{r}", (5 + rng() * 20).toFixed(1))
        .replace("{c}", String(Math.round(5 + rng() * 30)));

      alerts.push({
        id: `alert-${sku.id}-${alerts.length}`,
        skuId: sku.id,
        skuName: sku.name,
        brand: sku.brand,
        type,
        severity: sev,
        message: msg,
        timestamp: `${Math.floor(rng() * 12) + 1}m ago`,
        actionRequired: sev === "critical",
      });
    }
  });

  return alerts.sort((a, b) => {
    const sOrder = { critical: 0, warning: 1, info: 2 };
    return sOrder[a.severity] - sOrder[b.severity];
  });
}

// ─── SKU Priority Scores ──────────────────────────────────
export function generateSKUPriorities(): SKUPriority[] {
  return skuCatalog.map((sku) => {
    const rng = seeded(hashStr(sku.id + "priority"));
    const inv = generateInventoryDecision(sku.id);
    const ret = generateReturnAnalysis(sku.id);

    const stockoutFactor = inv.stockoutRisk * 40;
    const returnFactor = ret.riskScore * 0.3;
    const intentFactor = rng() * 20;
    const seasonalFactor = sku.seasonalPeak.length > 0 ? 10 : 0;

    const score = Math.min(100, Math.round(stockoutFactor + returnFactor + intentFactor + seasonalFactor));

    const factors: string[] = [];
    if (inv.stockoutRisk > 0.5) factors.push("High stockout risk");
    if (ret.riskScore > 40) factors.push("Elevated return rate");
    if (rng() > 0.5) factors.push("Rising intent signals");
    if (sku.seasonalPeak.length > 0) factors.push(`Seasonal peak: ${sku.seasonalPeak[0]}`);

    return {
      skuId: sku.id,
      skuName: sku.name,
      brand: sku.brand,
      priorityScore: score,
      riskFactors: factors,
      primaryConcern: factors[0] || "Monitoring",
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore);
}

// ─── KPIs ─────────────────────────────────────────────────
export function generateKPIs(): KPI[] {
  return [
    { label: "Weekly Revenue",    value: "$2.4M",  change: 8.3,   trend: "up",     icon: "revenue" },
    { label: "Active Stockouts",  value: "3",      change: -40,   trend: "down",   icon: "stockout" },
    { label: "Overstock Value",   value: "$182K",  change: 12.5,  trend: "up",     icon: "overstock" },
    { label: "Return Rate",       value: "8.2%",   change: -2.1,  trend: "down",   icon: "returns" },
    { label: "Forecast Accuracy", value: "94.1%",  change: 1.8,   trend: "up",     icon: "accuracy" },
    { label: "Active Alerts",     value: "12",     change: 15,    trend: "up",     icon: "alerts" },
  ];
}
