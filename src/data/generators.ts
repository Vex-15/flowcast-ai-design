import type {
  ForecastPoint, DemandDecomposition, AnomalyEvent,
  SignalFusionResult, SignalSource, IntentAccelerationResult, IntentSignal,
  ReturnAnalysis, ReturnReason, ReturnRiskFactor, ReturnTrendPoint,
  InventoryDecision, StoreInventory,
  SimulationParams, SimulationResult, ProfitLossResult, ReturnImpactResult, ForecastComparisonPoint,
  Explanation, FeatureImportance, ConfidenceBreakdown, ConfidenceSegment,
  OrchestrationAlert, SKUPriority, KPI,
  DynamicNotification, NotificationSummary,
  MigrationEdge, MigrationNode, DemandMigrationGraph,
  ElasticityResult, ElasticityPoint, CompetitorPriceTrendPoint,
  RegistryDemandResult, RegistryEvent, RegistryWeekBucket,
} from "./types";
import { getSKU, getStore, skuCatalog, stores } from "./brands";
import { SimpleLinearRegression } from 'ml-regression-simple-linear';

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

// ─── Probabilistic helpers (Box-Muller for normal distribution) ──
function normalRandom(rng: () => number, mean: number, stddev: number): number {
  const u1 = rng();
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(Math.max(0.0001, u1))) * Math.cos(2 * Math.PI * u2);
  return mean + stddev * z;
}

function binomialRandom(rng: () => number, n: number, p: number): number {
  let count = 0;
  for (let i = 0; i < Math.min(n, 100); i++) {
    if (rng() < p) count++;
  }
  return n > 100 ? Math.round(count * (n / 100)) : count;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function generateDemandForecast(skuId: string, days = 14): ForecastPoint[] {
  const rng = seeded(hashStr(skuId + "forecast_ml"));
  const sku = getSKU(skuId);
  const basePrice = sku.price;
  const baseDemand = Math.max(8, Math.round(200 - basePrice * 0.08 + rng() * 30));
  
  // 1. Generate Historical Training Data (Past 60 days)
  const trainingX: number[] = [];
  const trainingY: number[] = [];
  
  // Provide a base trend (either positive or negative)
  const globalTrend = (rng() - 0.4) * 0.8; // e.g., -0.32 to +0.48
  
  for (let i = -60; i <= 0; i++) {
    trainingX.push(i);
    const dayOfWeek = ((i % 7) + 7) % 7;
    const weekendBoost = (dayOfWeek >= 5) ? 1.35 : 1.0;
    const seasonality = Math.sin(i / 7) * 0.1 + 1; // Slight undulating seasonality
    const noise = 0.85 + rng() * 0.3;
    
    // Y = (Base + trend*t) * multipliers
    const yVal = Math.max(2, Math.round((baseDemand + globalTrend * i) * weekendBoost * seasonality * noise));
    trainingY.push(yVal);
  }

  // 2. Train Real ML Model (Simple Linear Regression)
  const regressionModel = new SimpleLinearRegression(trainingX, trainingY);

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  return Array.from({ length: days }, (_, i) => {
    const dayOffset = i + 1; // Future days 1 to 14
    const dayName = dayNames[(dayOffset + 1) % 7]; // Offset to match Mon-Sun sequence properly
    
    // 3. Inference / Prediction leveraging the ML model
    const mlBasePrediction = regressionModel.predict(dayOffset);
    
    // Reapply structural weekend boost since simple linear regression misses cyclical seasonality
    const dayOfWeek = ((dayOffset % 7) + 7) % 7;
    const weekendBoost = (dayOfWeek >= 5) ? 1.35 : 1.0;
    
    // The final prediction blends the ML trend with structural knowledge
    const predicted = Math.max(2, Math.round(mlBasePrediction * weekendBoost));
    
    const upper = Math.round(predicted * (1.1 + rng() * 0.08));
    const lower = Math.round(predicted * (0.85 + rng() * 0.05));
    
    // For the UI, we'll keep the first few days of "future" empty of actuals, 
    // but the ones before "today" have actuals
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
      // Pass ML metadata back if needed by UI
      mlData: {
        r2: regressionModel.score(trainingX, trainingY).r2,
        equation: regressionModel.toString(2)
      }
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

// ─── Return Intelligence (ENHANCED) ──────────────────────
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

const categoryReturnRates: Record<string, number> = {
  "Appliances": 0.06,
  "Cookware": 0.04,
  "Cutlery": 0.03,
  "Living Room": 0.14,
  "Bedding": 0.12,
  "Decor": 0.05,
  "Bedroom": 0.09,
  "Outdoor": 0.07,
  "Beds": 0.10,
  "Seating": 0.08,
  "Lighting": 0.05,
  "Hardware": 0.02,
  "Travel": 0.06,
  "Accessories": 0.04,
  "Dining": 0.08,
};

export function generateReturnAnalysis(skuId: string): ReturnAnalysis {
  const rng = seeded(hashStr(skuId + "return"));
  const sku = getSKU(skuId);
  
  // Use normal distribution for realistic return rate
  const baseReturnRate = sku.returnRiskBase;
  const returnRate = parseFloat(clamp(
    normalRandom(rng, baseReturnRate, baseReturnRate * 0.2),
    0.01, 0.35
  ).toFixed(3));
  
  // Risk score: composite of multiple factors
  const categoryAvg = categoryReturnRates[sku.category] || 0.08;
  const priceRiskFactor = sku.price > 1000 ? 15 : sku.price > 500 ? 10 : sku.price > 200 ? 5 : 0;
  const categoryRiskFactor = returnRate > categoryAvg ? 20 : 0;
  const baseRiskScore = returnRate * 400 + priceRiskFactor + categoryRiskFactor + rng() * 10;
  const riskScore = Math.min(100, Math.round(baseRiskScore));
  const riskLabel = riskScore > 60 ? "High" : riskScore > 35 ? "Medium" : "Low";

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

  // ─── NEW: Return Risk Factors (feature importance for return prediction)
  const riskFactors: ReturnRiskFactor[] = [
    {
      name: "Category Return Rate",
      weight: parseFloat((0.25 + rng() * 0.1).toFixed(2)),
      value: `${(categoryAvg * 100).toFixed(1)}% avg in ${sku.category}`,
      impact: categoryAvg > 0.1 ? "high" : categoryAvg > 0.06 ? "medium" : "low",
      direction: categoryAvg > 0.08 ? "increases_risk" : "decreases_risk",
    },
    {
      name: "Historical Return Rate",
      weight: parseFloat((0.30 + rng() * 0.1).toFixed(2)),
      value: `${(returnRate * 100).toFixed(1)}% past 90 days`,
      impact: returnRate > 0.15 ? "high" : returnRate > 0.08 ? "medium" : "low",
      direction: returnRate > categoryAvg ? "increases_risk" : "decreases_risk",
    },
    {
      name: "Price Point",
      weight: parseFloat((0.15 + rng() * 0.05).toFixed(2)),
      value: `$${sku.price.toFixed(0)} (${sku.price > 1000 ? "premium" : sku.price > 500 ? "mid-high" : "standard"})`,
      impact: sku.price > 1000 ? "high" : sku.price > 500 ? "medium" : "low",
      direction: sku.price > 500 ? "increases_risk" : "decreases_risk",
    },
    {
      name: "Customer Satisfaction Signal",
      weight: parseFloat((0.12 + rng() * 0.08).toFixed(2)),
      value: `${Math.round(60 + rng() * 35)}% positive reviews`,
      impact: rng() > 0.5 ? "medium" : "low",
      direction: rng() > 0.4 ? "decreases_risk" : "increases_risk",
    },
    {
      name: "Listing Quality Score",
      weight: parseFloat((0.10 + rng() * 0.05).toFixed(2)),
      value: `${Math.round(65 + rng() * 30)}/100`,
      impact: rng() > 0.6 ? "low" : "medium",
      direction: rng() > 0.5 ? "decreases_risk" : "increases_risk",
    },
    {
      name: "Seasonal Volatility",
      weight: parseFloat((0.08 + rng() * 0.04).toFixed(2)),
      value: sku.seasonalPeak.length > 0 ? `Peak: ${sku.seasonalPeak.join(", ")}` : "No seasonal pattern",
      impact: sku.seasonalPeak.length > 1 ? "medium" : "low",
      direction: sku.seasonalPeak.length > 0 ? "increases_risk" : "decreases_risk",
    },
  ];
  riskFactors.sort((a, b) => b.weight - a.weight);

  // Natural language explanation
  const topFactors = riskFactors.filter(f => f.direction === "increases_risk").slice(0, 2);
  const returnExplanation = riskLabel === "High"
    ? `High return risk (${riskScore}/100) driven by ${topFactors.map(f => f.name.toLowerCase()).join(" and ")}. Past ${(returnRate * 100).toFixed(1)}% return rate in ${sku.category} significantly exceeds category average of ${(categoryAvg * 100).toFixed(1)}%.`
    : riskLabel === "Medium"
    ? `Moderate return risk (${riskScore}/100). ${topFactors.length > 0 ? `${topFactors[0].name} is the primary concern.` : ""} Return rate of ${(returnRate * 100).toFixed(1)}% is ${returnRate > categoryAvg ? "above" : "near"} category average.`
    : `Low return risk (${riskScore}/100). Product performs well with ${(returnRate * 100).toFixed(1)}% return rate, below category average of ${(categoryAvg * 100).toFixed(1)}%.`;

  // Historical trend (6 months)
  const trendRng = seeded(hashStr(skuId + "returntrend"));
  const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  const historicalTrend: ReturnTrendPoint[] = months.map((month, i) => {
    const seasonalMod = (month === "Dec" || month === "Nov") ? 1.2 : (month === "Jan") ? 1.15 : 1.0;
    const rate = parseFloat(clamp(
      normalRandom(trendRng, returnRate * seasonalMod, returnRate * 0.15),
      0.01, 0.40
    ).toFixed(3));
    const volume = Math.round(normalRandom(trendRng, reportedDemand * 0.8, 20));
    return { month, rate, volume: Math.max(10, volume) };
  });

  return {
    skuId,
    returnRate,
    riskScore,
    riskLabel,
    reasons,
    suggestedFixes: fixes,
    phantomDemandGap,
    trueDemand,
    reportedDemand,
    riskFactors,
    returnExplanation,
    categoryAvgReturn: categoryAvg,
    historicalTrend,
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

// ─── What-If Simulation (ENHANCED with probabilistic modeling) ───
export function simulateWhatIf(skuId: string, params: SimulationParams): SimulationResult {
  const rng = seeded(hashStr(skuId + "sim" + JSON.stringify(params)));
  const sku = getSKU(skuId);
  const baseDailyDemand = Math.max(5, Math.round(60 - sku.price * 0.02 + rng() * 15));
  const baseStock = Math.round(baseDailyDemand * 14);

  // Seasonality modifier
  const seasonalMods: Record<string, number> = {
    "none": 1.0, "spring": 1.15, "summer": 1.1, "holiday": 1.4, "back-to-school": 1.25
  };
  const seasonMod = seasonalMods[params.seasonalityMode || "none"] || 1.0;

  const effectiveDemand = baseDailyDemand
    * params.demandMultiplier
    * (params.festivalActive ? 1.3 : 1.0)
    * (1 + params.promotionIntensity / 200)
    * seasonMod
    * (1 + (params.externalTrendFactor || 0) / 200);

  // Probabilistic return rate using binomial model
  const baseReturnRate = sku.returnRiskBase;
  const adjReturnRate = clamp(baseReturnRate * (1 + params.returnRateAdj / 100), 0, 0.5);
  
  const demandFluctuation = (params.demandFluctuation || 15) / 100; // convert % to fraction

  let runningStock = baseStock;
  const timeline: { day: string; stock: number; demand: number }[] = [];
  const forecastComparison: ForecastComparisonPoint[] = [];
  const confidenceInterval: { day: string; lower: number; upper: number; mean: number }[] = [];
  let stockoutDay: number | null = null;
  let totalDemand = 0;
  let totalReturns = 0;
  let totalStockoutLoss = 0;

  for (let i = 0; i < 21; i++) {
    // Use normal distribution for demand with variance control
    const dailyDemand = Math.max(0, Math.round(
      normalRandom(rng, effectiveDemand, effectiveDemand * demandFluctuation)
    ));
    
    // Binomial distribution for returns (each sale has p chance of return)
    const dailyReturns = binomialRandom(rng, dailyDemand, adjReturnRate);
    const netDemand = dailyDemand - dailyReturns;
    
    const previousStock = runningStock;
    runningStock = Math.max(0, runningStock - netDemand);
    
    // Track stockout loss
    if (runningStock === 0 && previousStock > 0) {
      totalStockoutLoss += (netDemand - previousStock) * sku.price;
    } else if (runningStock === 0) {
      totalStockoutLoss += netDemand * sku.price;
    }
    
    totalDemand += dailyDemand;
    totalReturns += dailyReturns;
    
    timeline.push({
      day: `Day ${i + 1}`,
      stock: runningStock,
      demand: dailyDemand,
    });
    
    // Forecast comparison (baseline vs simulated vs return-adjusted)
    const baselineDemand = Math.round(baseDailyDemand * (0.85 + rng() * 0.3));
    forecastComparison.push({
      day: `Day ${i + 1}`,
      baseline: baselineDemand,
      simulated: dailyDemand,
      returnAdjusted: dailyDemand - dailyReturns,
    });
    
    // Confidence interval
    const ciWidth = effectiveDemand * demandFluctuation * 1.96; // 95% CI
    confidenceInterval.push({
      day: `Day ${i + 1}`,
      mean: Math.round(effectiveDemand),
      lower: Math.round(Math.max(0, effectiveDemand - ciWidth)),
      upper: Math.round(effectiveDemand + ciWidth),
    });
    
    if (runningStock === 0 && stockoutDay === null) stockoutDay = i + 1;
  }

  const baseRevenue = baseDailyDemand * sku.price * 21;
  const grossRevenue = Math.round(totalDemand * sku.price);
  const returnCost = Math.round(totalReturns * sku.price * 0.85); // 85% cost of returns (refund + processing)
  const holdingCost = Math.round(baseStock * sku.price * 0.002 * 21); // 0.2% daily holding
  const netProfit = grossRevenue - returnCost - holdingCost - totalStockoutLoss;
  const baselineProfit = baseRevenue - Math.round(baseDailyDemand * 21 * baseReturnRate * sku.price * 0.85) - holdingCost;
  
  // P&L result
  const profitLoss: ProfitLossResult = {
    grossRevenue,
    returnCost,
    holdingCost,
    stockoutLoss: Math.round(totalStockoutLoss),
    netProfit,
    netProfitBaseline: baselineProfit,
    profitDelta: netProfit - baselineProfit,
    margin: grossRevenue > 0 ? parseFloat(((netProfit / grossRevenue) * 100).toFixed(1)) : 0,
  };

  // Return impact
  const returnsByReason = returnReasonPool.slice(0, 4).map((reason) => ({
    reason,
    count: Math.round(totalReturns * (0.1 + rng() * 0.3)),
    cost: Math.round(totalReturns * (0.1 + rng() * 0.3) * sku.price * 0.85),
  }));
  
  const returnImpact: ReturnImpactResult = {
    totalReturns,
    returnCostDollars: returnCost,
    effectiveReturnRate: totalDemand > 0 ? parseFloat((totalReturns / totalDemand).toFixed(3)) : 0,
    returnsByReason,
  };

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
    revenueImpact: grossRevenue,
    revenueDelta: grossRevenue - baseRevenue,
    stockoutDay,
    storeImpacts,
    profitLoss,
    returnImpact,
    forecastComparison,
    confidenceInterval,
  };
}

// ─── Explainability (ENHANCED) ───────────────────────────
export function generateExplanation(skuId: string, context: string = "forecast"): Explanation {
  const rng = seeded(hashStr(skuId + "explain" + context));
  const sku = getSKU(skuId);

  const allFeatures: FeatureImportance[] = [
    { feature: "Historical Sales Trend", importance: parseFloat((0.15 + rng() * 0.25).toFixed(2)), direction: "positive", description: `Strong upward trend with ${Math.round(5 + rng() * 15)}% growth over 30 days` },
    { feature: "Seasonal Pattern",       importance: parseFloat((0.1 + rng() * 0.2).toFixed(2)),  direction: "positive", description: sku.seasonalPeak.length > 0 ? `Active seasonal peak: ${sku.seasonalPeak.join(", ")}` : "No active seasonal pattern detected" },
    { feature: "Promotion Active",       importance: parseFloat((0.05 + rng() * 0.15).toFixed(2)), direction: "positive", description: `${rng() > 0.5 ? "Active promo driving +12% uplift" : "No active promotion — baseline demand"}` },
    { feature: "Festival Proximity",     importance: parseFloat((rng() * 0.2).toFixed(2)),         direction: rng() > 0.3 ? "positive" : "negative", description: `${rng() > 0.5 ? "Festival within 2 weeks — demand surge expected" : "No upcoming festival impact"}` },
    { feature: "Social Signal Strength", importance: parseFloat((rng() * 0.15).toFixed(2)),        direction: "positive", description: `Social mentions ${rng() > 0.5 ? "trending up 23%" : "stable at baseline levels"}` },
    { feature: "Weather Forecast",       importance: parseFloat((rng() * 0.1).toFixed(2)),         direction: rng() > 0.5 ? "positive" : "negative", description: `${rng() > 0.5 ? "Favorable weather expected — outdoor activity up" : "Rain forecast may dampen foot traffic"}` },
    { feature: "Return Rate History",    importance: parseFloat((0.05 + rng() * 0.1).toFixed(2)),  direction: "negative", description: `Past return rate of ${(sku.returnRiskBase * 100).toFixed(1)}% reduces effective demand` },
    { feature: "Competitor Pricing",     importance: parseFloat((rng() * 0.08).toFixed(2)),        direction: rng() > 0.5 ? "positive" : "negative", description: `${rng() > 0.5 ? "Competitor prices higher — competitive advantage" : "Competitor running aggressive promotion"}` },
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

  // ─── NEW: Confidence Breakdown
  const dataQuality = parseFloat((0.7 + rng() * 0.25).toFixed(2));
  const historicalConsistency = parseFloat((0.6 + rng() * 0.35).toFixed(2));
  const varianceScore = parseFloat((0.5 + rng() * 0.4).toFixed(2));
  const modelFit = parseFloat((0.65 + rng() * 0.3).toFixed(2));
  const sampleSize = parseFloat((0.7 + rng() * 0.25).toFixed(2));

  const segments: ConfidenceSegment[] = [
    { label: "Data Quality", value: dataQuality, color: "217 91% 60%", description: `${Math.round(dataQuality * 100)}% — ${dataQuality > 0.8 ? "Excellent data completeness with minimal gaps" : "Some missing data points, but sufficient for prediction"}` },
    { label: "Historical Consistency", value: historicalConsistency, color: "265 60% 62%", description: `${Math.round(historicalConsistency * 100)}% — ${historicalConsistency > 0.75 ? "Highly consistent historical patterns" : "Moderate variance in historical patterns"}` },
    { label: "Variance", value: varianceScore, color: "152 69% 45%", description: `${Math.round(varianceScore * 100)}% — ${varianceScore > 0.7 ? "Low prediction variance" : "Moderate variance — wider confidence intervals"}` },
    { label: "Model Fit", value: modelFit, color: "38 92% 50%", description: `${Math.round(modelFit * 100)}% — ${modelFit > 0.8 ? "Model fits observed data extremely well" : "Reasonable model fit with room for improvement"}` },
    { label: "Sample Size", value: sampleSize, color: "340 70% 55%", description: `${Math.round(sampleSize * 100)}% — ${sampleSize > 0.8 ? "Large sample with 90+ days of data" : "Adequate sample size (60+ days)"}` },
  ];

  const confidenceBreakdown: ConfidenceBreakdown = {
    overall: confidence,
    dataQuality,
    historicalConsistency,
    varianceScore,
    modelFit,
    sampleSize,
    segments,
  };

  // Natural language reasons
  const naturalLanguageReasons: string[] = [];
  topPositive.forEach(f => {
    naturalLanguageReasons.push(`📈 ${f.feature}: ${f.description}`);
  });
  topNegative.forEach(f => {
    naturalLanguageReasons.push(`📉 ${f.feature}: ${f.description}`);
  });
  if (sku.seasonalPeak.length > 0) {
    naturalLanguageReasons.push(`🗓️ Seasonal factor: Product is in peak season (${sku.seasonalPeak.join(", ")})`);
  }
  naturalLanguageReasons.push(`🎯 Model confidence is ${confidence > 0.85 ? "very high" : confidence > 0.75 ? "high" : "moderate"} at ${(confidence * 100).toFixed(0)}%`);

  return {
    summary: `${context === "forecast" ? "Demand prediction" : "Risk assessment"} for ${sku.name}`,
    factors: top,
    confidence,
    narrative,
    confidenceBreakdown,
    predictionContext: context as "forecast" | "return_risk" | "inventory",
    naturalLanguageReasons,
  };
}

// ─── Dynamic Notifications (NEW) ──────────────────────────
export function generateDynamicNotifications(): DynamicNotification[] {
  const rng = seeded(Date.now ? 42 : 42); // deterministic for demo
  const notifications: DynamicNotification[] = [];

  skuCatalog.forEach((sku) => {
    const skuRng = seeded(hashStr(sku.id + "notif"));
    const forecast = generateDemandForecast(sku.id, 7);
    const returnData = generateReturnAnalysis(sku.id);
    const inventory = generateInventoryDecision(sku.id);
    const intent = generateIntentAcceleration(sku.id);

    // Rule 1: Demand spike detection (if actual > forecast by 20%+)
    const spikeDay = forecast.find(f => f.actual && f.actual > f.predicted * 1.2);
    if (spikeDay && skuRng() > 0.3) {
      const deviation = spikeDay.actual! / spikeDay.predicted;
      notifications.push({
        id: `notif-spike-${sku.id}`,
        type: "demand_spike",
        priority: deviation > 1.4 ? "critical" : deviation > 1.25 ? "high" : "medium",
        title: "Demand Surge Detected",
        message: `${sku.name} demand is ${Math.round((deviation - 1) * 100)}% above forecast on ${spikeDay.date}. Consider increasing reorder quantity.`,
        skuId: sku.id,
        skuName: sku.name,
        brand: sku.brand,
        triggerCondition: "actual_demand > forecast * 1.20",
        triggerValue: spikeDay.actual!,
        threshold: Math.round(spikeDay.predicted * 1.2),
        timestamp: `${Math.round(1 + skuRng() * 15)}m ago`,
        isRead: skuRng() > 0.7,
        actionSuggestion: `Increase reorder by ${Math.round(deviation * 20)}% and alert warehouse team`,
        icon: "TrendingUp",
        relatedView: "sku-deep-dive",
        relatedTab: "predictive-demand",
      });
    }

    // Rule 2: Return anomaly (REMOVED for "Supply Chain Sees Future" pitch)
    /*
    if (returnData.returnRate > returnData.categoryAvgReturn * 1.5 && skuRng() > 0.4) {
      const severity = returnData.riskScore > 60 ? "critical" : returnData.riskScore > 40 ? "high" : "medium";
      ...
    }
    */

    // Rule 3: Stockout warning
    if (inventory.daysUntilStockout < 5 && skuRng() > 0.3) {
      notifications.push({
        id: `notif-stockout-${sku.id}`,
        type: "stockout_warning",
        priority: inventory.daysUntilStockout <= 2 ? "critical" : "high",
        title: "Stockout Imminent",
        message: `${sku.name} will stock out in ${inventory.daysUntilStockout} days at current sell-through rate. ${inventory.currentStock} units remaining.`,
        skuId: sku.id,
        skuName: sku.name,
        brand: sku.brand,
        triggerCondition: "days_until_stockout < 5",
        triggerValue: inventory.daysUntilStockout,
        threshold: 5,
        timestamp: `${Math.round(1 + skuRng() * 10)}m ago`,
        isRead: false,
        actionSuggestion: `Emergency reorder ${inventory.reorderQty} units immediately`,
        icon: "AlertTriangle",
        relatedView: "sku-deep-dive",
        relatedTab: "orchestration",
      });
    }

    // Rule 4: Overstock alert
    if (inventory.overstockRisk > 0.6 && skuRng() > 0.5) {
      notifications.push({
        id: `notif-overstock-${sku.id}`,
        type: "overstock_alert",
        priority: "medium",
        title: "Overstock Risk",
        message: `${sku.name} has ${inventory.daysUntilStockout} days of supply — ${Math.round(inventory.overstockRisk * 100)}% overstock risk. Consider promotional pricing.`,
        skuId: sku.id,
        skuName: sku.name,
        brand: sku.brand,
        triggerCondition: "overstock_risk > 0.60",
        triggerValue: parseFloat((inventory.overstockRisk * 100).toFixed(1)),
        threshold: 60,
        timestamp: `${Math.round(10 + skuRng() * 45)}m ago`,
        isRead: skuRng() > 0.5,
        actionSuggestion: "Consider markdown strategy or cross-store transfer",
        icon: "Package",
        relatedView: "sku-deep-dive",
        relatedTab: "orchestration",
      });
    }

    // Rule 5: Intent surge (pre-spike pattern)
    if (intent.spikePredicted && skuRng() > 0.4) {
      notifications.push({
        id: `notif-intent-${sku.id}`,
        type: "intent_surge",
        priority: intent.confidence > 0.7 ? "high" : "medium",
        title: "Intent Spike Detected",
        message: `${sku.name} showing pre-spike behavior — saves up ${Math.round(intent.signals[0]?.changePercent || 15)}%, predicted spike in ${intent.timeToSpike}.`,
        skuId: sku.id,
        skuName: sku.name,
        brand: sku.brand,
        triggerCondition: "intent_confidence > 0.50 && spike_predicted",
        triggerValue: parseFloat((intent.confidence * 100).toFixed(1)),
        threshold: 50,
        timestamp: `${Math.round(2 + skuRng() * 20)}m ago`,
        isRead: skuRng() > 0.5,
        actionSuggestion: "Pre-position stock and prepare for demand surge",
        icon: "Zap",
        relatedView: "sku-deep-dive",
        relatedTab: "predictive-demand",
      });
    }
  });

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  notifications.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return notifications;
}

export function getNotificationSummary(notifications: DynamicNotification[]): NotificationSummary {
  const byType: Record<DynamicNotification["type"], number> = {
    demand_spike: 0, return_anomaly: 0, stockout_warning: 0,
    overstock_alert: 0, forecast_drift: 0, intent_surge: 0,
  };
  notifications.forEach(n => { byType[n.type] = (byType[n.type] || 0) + 1; });

  return {
    total: notifications.length,
    unread: notifications.filter(n => !n.isRead).length,
    critical: notifications.filter(n => n.priority === "critical").length,
    high: notifications.filter(n => n.priority === "high").length,
    medium: notifications.filter(n => n.priority === "medium").length,
    low: notifications.filter(n => n.priority === "low").length,
    byType,
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
  // Pre-build migration graph to enrich priority data
  const migGraph = generateMigrationGraph();
  const absorberMap = new Map<string, string[]>(); // skuId -> list of source skuIds it absorbs from
  const senderMap   = new Map<string, string[]>(); // skuId -> list of target skuIds it sends to
  migGraph.edges.forEach((e) => {
    if (!absorberMap.has(e.toSkuId))   absorberMap.set(e.toSkuId,   []);
    if (!senderMap.has(e.fromSkuId))   senderMap.set(e.fromSkuId,   []);
    absorberMap.get(e.toSkuId)!.push(e.fromSkuId);
    senderMap.get(e.fromSkuId)!.push(e.toSkuId);
  });

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

    // Migration risk classification
    const absorbsFrom = absorberMap.get(sku.id) || [];
    const sendsTo     = senderMap.get(sku.id)   || [];
    const isSourceAtRisk = inv.daysUntilStockout < 7 || inv.stockoutRisk > 0.55;
    // absorbers from critical sources are high absorbers
    const criticalSources = absorbsFrom.filter((srcId) => {
      const srcInv = generateInventoryDecision(srcId);
      return srcInv.daysUntilStockout < 7 || srcInv.stockoutRisk > 0.55;
    });
    const isHighAbsorber = criticalSources.length > 0;
    const migrationRiskScore = Math.min(100, Math.round(
      (isHighAbsorber ? 40 : 0) + (isSourceAtRisk ? 40 : 0) + Math.min(20, criticalSources.length * 10)
    ));
    const migrationRisk: SKUPriority["migrationRisk"] =
      isHighAbsorber && isSourceAtRisk ? "dual_risk"
      : isHighAbsorber ? "high_absorber"
      : isSourceAtRisk && sendsTo.length > 0 ? "source_at_risk"
      : "none";

    return {
      skuId: sku.id,
      skuName: sku.name,
      brand: sku.brand,
      priorityScore: score,
      riskFactors: factors,
      primaryConcern: factors[0] || "Monitoring",
      migrationRisk,
      migrationRiskScore,
      absorbsFromSkus: absorbsFrom,
      sendsToSkus: sendsTo,
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore);
}

// ─── KPIs (DYNAMIC per brand) ─────────────────────────────
export function generateKPIs(brandId?: string): KPI[] {
  const filteredSKUs = brandId && brandId !== "all"
    ? skuCatalog.filter(s => s.brand === brandId)
    : skuCatalog;

  const rng = seeded(hashStr((brandId || "all") + "kpiCalc"));

  // ── Revenue calculation: aggregate weekly revenue across SKUs ──
  let totalWeeklyRevenue = 0;
  let stockoutCount = 0;
  let overstockValue = 0;
  let totalReturnRate = 0;
  let totalForecastAccuracy = 0;
  let alertCount = 0;

  filteredSKUs.forEach(sku => {
    const inv = generateInventoryDecision(sku.id);
    const ret = generateReturnAnalysis(sku.id);
    const forecast = generateDemandForecast(sku.id, 7);

    // Weekly revenue: daily sell-through × price × 7
    const dailySellThrough = Math.max(1, Math.round(inv.currentStock / Math.max(1, inv.daysUntilStockout)));
    totalWeeklyRevenue += dailySellThrough * sku.price * 7;

    // Stockouts: count SKUs with ≤3 days supply
    if (inv.daysUntilStockout <= 3) stockoutCount++;

    // Overstock: value of excess inventory (>21 days supply)
    if (inv.daysUntilStockout > 21) {
      const excessDays = inv.daysUntilStockout - 21;
      const excessUnits = Math.round(dailySellThrough * excessDays);
      overstockValue += excessUnits * sku.price;
    }

    // Return rate: weighted average by demand volume
    totalReturnRate += ret.returnRate * dailySellThrough;

    // Forecast accuracy: compare actuals to predicted
    const forecastWithActuals = forecast.filter(f => f.actual !== undefined);
    if (forecastWithActuals.length > 0) {
      const accuracy = forecastWithActuals.reduce((sum, f) => {
        const error = Math.abs((f.actual! - f.predicted) / f.predicted);
        return sum + (1 - error);
      }, 0) / forecastWithActuals.length;
      totalForecastAccuracy += accuracy;
    }
  });

  // Normalize
  const totalDailySellThrough = filteredSKUs.reduce((sum, sku) => {
    const inv = generateInventoryDecision(sku.id);
    return sum + Math.max(1, Math.round(inv.currentStock / Math.max(1, inv.daysUntilStockout)));
  }, 0);

  const avgReturnRate = totalDailySellThrough > 0
    ? (totalReturnRate / totalDailySellThrough) * 100
    : 8.0;

  const avgForecastAccuracy = filteredSKUs.length > 0
    ? (totalForecastAccuracy / filteredSKUs.length) * 100
    : 90.0;

  // Count alerts for this brand
  const allAlerts = generateAlerts();
  const brandAlerts = brandId && brandId !== "all"
    ? allAlerts.filter(a => a.brand === brandId)
    : allAlerts;
  alertCount = brandAlerts.length;

  // Format revenue ($X.XM or $XXXK)
  const fmtRevenue = totalWeeklyRevenue >= 1_000_000
    ? `$${(totalWeeklyRevenue / 1_000_000).toFixed(1)}M`
    : `$${Math.round(totalWeeklyRevenue / 1000)}K`;

  const fmtOverstock = overstockValue >= 1_000_000
    ? `$${(overstockValue / 1_000_000).toFixed(1)}M`
    : `$${Math.round(overstockValue / 1000)}K`;

  // Seeded "deltas" so they remain stable per brand
  const revDelta = parseFloat((5 + rng() * 8).toFixed(1));
  const stockDelta = -Math.round(20 + rng() * 40);
  const overstockDelta = parseFloat((5 + rng() * 15).toFixed(1));
  const returnDelta = -parseFloat((0.5 + rng() * 3).toFixed(1));
  const accuracyDelta = parseFloat((0.5 + rng() * 2.5).toFixed(1));
  const alertDelta = Math.round(-5 + rng() * 30);

  return [
    { label: "Weekly Revenue",    value: fmtRevenue,                            change: revDelta,       trend: "up",     icon: "revenue" },
    { label: "Active Stockouts",  value: String(stockoutCount),                 change: stockDelta,     trend: "down",   icon: "stockout" },
    { label: "Overstock Value",   value: fmtOverstock,                          change: overstockDelta, trend: "up",     icon: "overstock" },
    { label: "Return Rate",       value: `${avgReturnRate.toFixed(1)}%`,        change: returnDelta,    trend: "down",   icon: "returns" },
    { label: "Forecast Accuracy", value: `${avgForecastAccuracy.toFixed(1)}%`,  change: accuracyDelta,  trend: "up",     icon: "accuracy" },
    { label: "Active Alerts",     value: String(alertCount),                    change: alertDelta,     trend: alertDelta > 0 ? "up" : "down", icon: "alerts" },
  ];
}

// ─── Demand Migration Graph ────────────────────────────────
export function generateMigrationGraph(filterCategory?: string): DemandMigrationGraph {
  // Group skus by category
  const categoryMap = new Map<string, typeof skuCatalog>();
  skuCatalog.forEach((sku) => {
    if (!categoryMap.has(sku.category)) categoryMap.set(sku.category, []);
    categoryMap.get(sku.category)!.push(sku);
  });

  const allNodes: MigrationNode[] = [];
  const allEdges: MigrationEdge[] = [];

  // Pre-calculate inventory for all SKUs
  const invCache = new Map<string, ReturnType<typeof generateInventoryDecision>>();
  skuCatalog.forEach((sku) => {
    invCache.set(sku.id, generateInventoryDecision(sku.id));
  });

  skuCatalog.forEach((sku) => {
    const inv = invCache.get(sku.id)!;
    // Revenue velocity: weekly demand estimate × price
    const weeklyUnits = Math.max(5, Math.round(inv.currentStock / Math.max(1, inv.daysUntilStockout) * 7));
    const revenueVelocity = weeklyUnits * sku.price;
    const weeklyDemandValue = revenueVelocity;

    // Stock status from store breakdown aggregate
    const criticalStores = inv.storeBreakdown.filter((s) => s.status === "critical").length;
    const lowStores      = inv.storeBreakdown.filter((s) => s.status === "low").length;
    const stockStatus: MigrationNode["stockStatus"] =
      criticalStores >= 2 || inv.daysUntilStockout <= 3 ? "critical"
      : lowStores >= 2 || inv.daysUntilStockout <= 7 ? "low"
      : inv.overstockRisk > 0.5 ? "overstock"
      : "ok";

    allNodes.push({
      skuId: sku.id,
      skuName: sku.name,
      brand: sku.brand,
      category: sku.category,
      revenueVelocity,
      stockStatus,
      daysSupply: inv.daysUntilStockout,
      weeklyDemandValue,
      outgoingEdges: [],
      incomingEdges: [],
      lostProbability: 0,
      deferredProbability: 0,
      x: 0, y: 0, vx: 0, vy: 0,
    });
  });

  // Build migration edges: only within same category, requires 2+ SKUs
  categoryMap.forEach((skusInCat) => {
    if (skusInCat.length < 2) return;

    skusInCat.forEach((fromSku) => {
      const fromNode = allNodes.find((n) => n.skuId === fromSku.id)!;
      const isAtRisk = fromNode.stockStatus === "critical" || fromNode.stockStatus === "low";

      // Potential absorbers: all other SKUs in category that are NOT critical
      const absorbers = skusInCat.filter(
        (s) => s.id !== fromSku.id && allNodes.find((n) => n.skuId === s.id)?.stockStatus !== "critical"
      );
      if (absorbers.length === 0) return;

      // Distribute migration probability: ~55–65% absorbed, ~25–33% lost, 7–15% deferred
      const rng = seeded(hashStr(fromSku.id + "migration"));
      const totalAbsorbed = 0.52 + rng() * 0.15; // 52–67%
      const lost          = 0.22 + rng() * 0.12; // 22–34%
      const deferred      = parseFloat((1 - totalAbsorbed - lost).toFixed(3));

      fromNode.lostProbability = parseFloat(lost.toFixed(3));
      fromNode.deferredProbability = Math.max(0, parseFloat(deferred.toFixed(3)));

      // Distribute absorbed portion across absorbers (weighted by revenue velocity)
      const absorberVelocities = absorbers.map((s) => {
        const r = seeded(hashStr(s.id + fromSku.id + "vel"));
        return Math.max(1, allNodes.find((n) => n.skuId === s.id)!.revenueVelocity + r() * 1000);
      });
      const totalVelocity = absorberVelocities.reduce((a, v) => a + v, 0);

      absorbers.forEach((toSku, idx) => {
        const edgeRng = seeded(hashStr(fromSku.id + toSku.id + "edge"));
        const probability = parseFloat((totalAbsorbed * absorberVelocities[idx] / totalVelocity).toFixed(3));
        if (probability < 0.03) return; // skip negligible edges

        const weeklyDemandAtRisk = Math.round(fromNode.weeklyDemandValue * probability);
        const edge: MigrationEdge = {
          fromSkuId: fromSku.id,
          toSkuId: toSku.id,
          probability,
          weeklyDemandAtRisk,
          historicalAbsorptionRate: parseFloat((0.6 + edgeRng() * 0.35).toFixed(2)),
          isActive: isAtRisk,
        };

        allEdges.push(edge);
        fromNode.outgoingEdges.push(edge);
        const toNode = allNodes.find((n) => n.skuId === toSku.id)!;
        toNode.incomingEdges.push(edge);
      });
    });
  });

  // Apply initial force layout positions in a grid-like structure
  // Use a simple categorical layout: group by category horizontally
  const categoryList = Array.from(categoryMap.keys());
  const filteredNodes = filterCategory
    ? allNodes.filter((n) => n.category === filterCategory)
    : allNodes;

  // Assign initial positions using a deterministic grid
  filteredNodes.forEach((node) => {
    const catIdx = categoryList.indexOf(node.category);
    const catNodes = filteredNodes.filter((n) => n.category === node.category);
    const posInCat = catNodes.indexOf(node);
    const cols = Math.ceil(Math.sqrt(filteredNodes.length));
    const catCol = catIdx % cols;
    const catRow = Math.floor(catIdx / cols);
    const rng2 = seeded(hashStr(node.skuId + "pos"));
    node.x = catCol * 220 + posInCat * 80 + rng2() * 30 + 80;
    node.y = catRow * 200 + rng2() * 40 + 80;
  });

  const criticalNodes  = filteredNodes.filter((n) => n.stockStatus === "critical");
  const lowNodes       = filteredNodes.filter((n) => n.stockStatus === "low");
  const atRiskNodes    = [...criticalNodes, ...lowNodes];
  const totalAtRisk    = atRiskNodes.reduce((s, n) => s + n.weeklyDemandValue, 0);
  const lostEstimate   = atRiskNodes.reduce((s, n) => s + n.weeklyDemandValue * n.lostProbability, 0);
  const absorbEstimate = atRiskNodes.reduce((s, n) => s + n.weeklyDemandValue * (1 - n.lostProbability - n.deferredProbability), 0);

  return {
    nodes: filterCategory ? filteredNodes : allNodes,
    edges: filterCategory
      ? allEdges.filter((e) => {
          const fn = allNodes.find((n) => n.skuId === e.fromSkuId);
          return fn?.category === filterCategory;
        })
      : allEdges,
    totalWeeklyDemandAtRisk: Math.round(totalAtRisk),
    criticalNodeCount: criticalNodes.length,
    lostDemandEstimate: Math.round(lostEstimate),
    absorbedDemandEstimate: Math.round(absorbEstimate),
  };
}

// ─── Price Elasticity Intelligence ─────────────────────────
export function generateElasticity(skuId: string): ElasticityResult {
  const rng = seeded(hashStr(skuId + "elasticity"));
  const sku = getSKU(skuId);
  const baseDemand = Math.max(8, Math.round(200 - sku.price * 0.08 + rng() * 30));

  // Determine elasticity coefficient range based on category / price
  let coeffMin: number;
  let coeffMax: number;
  const cat = sku.category.toLowerCase();

  if ((cat === "living room" || cat === "bedroom" || cat === "beds" || cat === "seating" || cat === "dining" || cat === "outdoor") && sku.price > 1000) {
    // Furniture / luxury — inelastic
    coeffMin = -1.0;
    coeffMax = -0.6;
  } else if (cat === "appliances") {
    // Appliances — elastic
    coeffMin = -1.8;
    coeffMax = -1.2;
  } else if (cat === "cookware" || cat === "cutlery") {
    // Cookware / cutlery
    coeffMin = -1.3;
    coeffMax = -0.9;
  } else if (cat === "bedding" || cat === "decor" || cat === "home") {
    // Bedding / decor — highly elastic
    coeffMin = -2.0;
    coeffMax = -1.4;
  } else {
    // Default (lighting, hardware, travel, accessories)
    coeffMin = -1.5;
    coeffMax = -0.8;
  }

  const elasticityCoefficient = parseFloat((coeffMax + (coeffMin - coeffMax) * rng()).toFixed(2));

  // Label
  const absCoeff = Math.abs(elasticityCoefficient);
  const elasticityLabel: ElasticityResult["elasticityLabel"] =
    absCoeff < 0.8 ? "Inelastic"
    : absCoeff <= 1.0 ? "Unit Elastic"
    : absCoeff <= 1.5 ? "Elastic"
    : "Highly Elastic";

  // Generate 13-point curve
  const multipliers = [0.70, 0.75, 0.80, 0.85, 0.90, 0.95, 1.00, 1.05, 1.10, 1.15, 1.20, 1.25, 1.30];
  const curve: ElasticityPoint[] = multipliers.map((multiplier) => {
    const price = parseFloat((sku.price * multiplier).toFixed(2));
    const predictedUnits = Math.round(
      baseDemand * Math.pow(multiplier, elasticityCoefficient) * (0.95 + rng() * 0.1)
    );
    const predictedRevenue = parseFloat((price * predictedUnits).toFixed(2));
    const confidenceBand = 0.08 + rng() * 0.04; // ±8–12%
    const confidenceLower = Math.round(predictedUnits * (1 - confidenceBand));
    const confidenceUpper = Math.round(predictedUnits * (1 + confidenceBand));

    return {
      priceMultiplier: multiplier,
      price,
      predictedUnits,
      predictedRevenue,
      confidenceLower,
      confidenceUpper,
    };
  });

  // Revenue-maximising price: find curve point with highest predictedRevenue
  const revenueMaxPoint = curve.reduce((best, pt) =>
    pt.predictedRevenue > best.predictedRevenue ? pt : best
  , curve[0]);
  const revenueMaxPrice = revenueMaxPoint.price;
  const revenueMaxUnits = revenueMaxPoint.predictedUnits;
  const revenueMaxRevenue = revenueMaxPoint.predictedRevenue;

  // Markdown sweet spot: contiguous band below 1.0x where revenue exceeds revenue at current price
  const currentRevenue = curve.find((p) => p.priceMultiplier === 1.00)!.predictedRevenue;
  const belowCurrent = curve.filter((p) => p.priceMultiplier < 1.00 && p.predictedRevenue > currentRevenue);
  let sweetSpotLow = sku.price * 0.85;
  let sweetSpotHigh = sku.price * 0.95;

  if (belowCurrent.length > 0) {
    // Find contiguous band
    const sorted = belowCurrent.sort((a, b) => a.priceMultiplier - b.priceMultiplier);
    sweetSpotLow = sorted[0].price;
    sweetSpotHigh = sorted[sorted.length - 1].price;
  }

  const markdownSweetSpot = { low: sweetSpotLow, high: sweetSpotHigh };

  // Competitor anchor: typically 10–20% cheaper
  const competitorAnchor = parseFloat((sku.price * (0.88 + rng() * 0.18)).toFixed(2));

  // Generate 30-day competitor pricing timeline
  const competitorTimeline: CompetitorPriceTrendPoint[] = [];
  const trendRng = seeded(hashStr(skuId + "comptimeline"));
  let competitorRunningPrice = competitorAnchor * (1.02 + trendRng() * 0.06); // start slightly higher than anchor
  const yourRunningPrice = sku.price; // your price is stable
  for (let d = 0; d < 30; d++) {
    // Random walk for competitor: drift downward with occasional bumps
    const dailyChange = (trendRng() - 0.55) * sku.price * 0.012; // slight downward bias
    competitorRunningPrice = Math.max(
      sku.price * 0.75,
      Math.min(sku.price * 1.15, competitorRunningPrice + dailyChange)
    );
    // Occasional significant price drops (simulate a sale)
    if (trendRng() > 0.92) {
      competitorRunningPrice -= sku.price * (0.03 + trendRng() * 0.05);
    }
    const undercutPct = parseFloat((((competitorRunningPrice - yourRunningPrice) / yourRunningPrice) * 100).toFixed(1));
    competitorTimeline.push({
      day: `Day ${d + 1}`,
      dayIndex: d + 1,
      yourPrice: parseFloat(yourRunningPrice.toFixed(2)),
      competitorPrice: parseFloat(competitorRunningPrice.toFixed(2)),
      isUndercut: competitorRunningPrice < yourRunningPrice,
      undercutPct,
    });
  }

  // Seasonal elasticity boost
  const seasonalElasticityBoost = sku.seasonalPeak.length > 0
    ? parseFloat((0.1 + rng() * 0.25).toFixed(2))
    : parseFloat((rng() * 0.08).toFixed(2));

  // Narrative
  const narrative = `A 10% price reduction drives ${Math.abs(elasticityCoefficient * 10).toFixed(0)}% more units for ${sku.name}. Revenue is maximised at $${revenueMaxPrice.toFixed(2)} — ${revenueMaxPrice < sku.price ? "below" : "above"} the current price point.`;

  return {
    skuId,
    currentPrice: sku.price,
    elasticityCoefficient,
    elasticityLabel,
    revenueMaxPrice,
    revenueMaxUnits,
    revenueMaxRevenue,
    markdownSweetSpot,
    curve,
    competitorAnchor,
    competitorTimeline,
    seasonalElasticityBoost,
    narrative,
  };
}

// ─── Registry Demand Intelligence ──────────────────────────
export function generateRegistryDemand(skuId: string): RegistryDemandResult {
  const rng = seeded(hashStr(skuId + "registry"));
  const sku = getSKU(skuId);

  // Determine registry activity level
  const hasRegistrySeasons = sku.seasonalPeak.some(p => ["wedding", "holiday"].includes(p));
  const activeRegistries = hasRegistrySeasons
    ? Math.round(8 + rng() * 40)
    : Math.round(1 + rng() * 8);

  // Determine dominant event type by brand/category
  const cat = sku.category.toLowerCase();
  const brandId = sku.brand;
  const getEventType = (): RegistryEvent["eventType"] => {
    const r = rng();
    if (brandId === "pbk") return r < 0.7 ? "baby" : r < 0.85 ? "birthday" : "housewarming";
    if (brandId === "we") return r < 0.5 ? "housewarming" : r < 0.8 ? "wedding" : "birthday";
    if (["cookware", "cutlery", "appliances", "living room"].includes(cat))
      return r < 0.6 ? "wedding" : r < 0.8 ? "housewarming" : "birthday";
    return r < 0.4 ? "wedding" : r < 0.65 ? "housewarming" : r < 0.85 ? "birthday" : "baby";
  };

  // Generate 5 registry events
  const baseDate = new Date(2026, 3, 10); // Apr 10, 2026
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const events: RegistryEvent[] = Array.from({ length: 5 }, (_, i) => {
    const eventType = getEventType();
    const daysUntilEvent = Math.round(7 + rng() * 83);
    const eventDateObj = new Date(baseDate.getTime() + daysUntilEvent * 86400000);
    const eventDate = `${monthNames[eventDateObj.getMonth()]} ${String(eventDateObj.getDate()).padStart(2, "0")}`;

    const guestCount = Math.round(60 + rng() * 180);

    // Purchase rate scales inversely with price
    let purchaseRateMin: number, purchaseRateMax: number;
    if (sku.price > 500) { purchaseRateMin = 0.08; purchaseRateMax = 0.15; }
    else if (sku.price >= 200) { purchaseRateMin = 0.15; purchaseRateMax = 0.25; }
    else { purchaseRateMin = 0.25; purchaseRateMax = 0.45; }
    const expectedPurchaseRate = parseFloat((purchaseRateMin + rng() * (purchaseRateMax - purchaseRateMin)).toFixed(3));
    const projectedUnits = Math.round(guestCount * expectedPurchaseRate);

    // Peak week: ~2 weeks before event
    const peakWeekStart = new Date(eventDateObj.getTime() - 14 * 86400000);
    const peakWeekEnd = new Date(peakWeekStart.getTime() + 6 * 86400000);
    const peakWeek = `${monthNames[peakWeekStart.getMonth()]} ${peakWeekStart.getDate()} \u2013 ${monthNames[peakWeekEnd.getMonth()]} ${peakWeekEnd.getDate()}`;

    return {
      registryId: `REG-${skuId}-${String(i + 1).padStart(3, "0")}`,
      eventType,
      eventDate,
      guestCount,
      expectedPurchaseRate,
      projectedUnits,
      peakWeek,
      daysUntilEvent,
    };
  });

  events.sort((a, b) => a.daysUntilEvent - b.daysUntilEvent);

  // Generate 8-week wave starting Apr 14 2026
  const waveStart = new Date(2026, 3, 14);
  const baseDemand = Math.max(8, Math.round(200 - sku.price * 0.08 + rng() * 30));

  const weeklyWave: RegistryWeekBucket[] = Array.from({ length: 8 }, (_, weekIdx) => {
    const weekDate = new Date(waveStart.getTime() + weekIdx * 7 * 86400000);
    const weekLabel = `${monthNames[weekDate.getMonth()]} ${String(weekDate.getDate()).padStart(2, "0")}`;

    const organicUnits = Math.round(baseDemand * (0.85 + rng() * 0.3));

    // Registry contribution: sum bell curves from all events
    let registryUnits = 0;
    let registryCount = 0;
    events.forEach((evt) => {
      const eventDateMs = baseDate.getTime() + evt.daysUntilEvent * 86400000;
      const peakWeekIdx = Math.max(0, Math.min(7,
        Math.round((eventDateMs - 14 * 86400000 - waveStart.getTime()) / (7 * 86400000))
      ));
      const baseRegistryLoad = evt.projectedUnits / 3;
      const contribution = Math.round(
        baseRegistryLoad * Math.exp(-0.5 * Math.pow((weekIdx - peakWeekIdx) / 1.5, 2))
      );
      if (contribution > 0) {
        registryUnits += contribution;
        registryCount++;
      }
    });

    return {
      weekLabel,
      organicUnits,
      registryUnits,
      totalUnits: organicUnits + registryUnits,
      registryCount,
    };
  });

  // Aggregate stats
  const totalProjectedRegistryUnits = events.reduce((s, e) => s + e.projectedUnits, 0);
  const organicTotal = weeklyWave.reduce((s, w) => s + w.organicUnits, 0);
  const registryRevenueAtStake = Math.round(totalProjectedRegistryUnits * sku.price);

  // Peak registry week
  const peakWeekBucket = weeklyWave.reduce((best, w) =>
    w.registryUnits > best.registryUnits ? w : best
  , weeklyWave[0]);
  const peakRegistryWeek = peakWeekBucket.weekLabel;
  const peakRegistryUnits = peakWeekBucket.registryUnits;

  // Registry share of demand
  const registryShareOfDemand = parseFloat(
    Math.min(0.7, totalProjectedRegistryUnits / (totalProjectedRegistryUnits + organicTotal)).toFixed(3)
  );

  // Inventory gap
  const currentStock = generateInventoryDecision(skuId).currentStock;
  const totalProjected8Weeks = weeklyWave.reduce((s, w) => s + w.totalUnits, 0);
  const inventoryGap = Math.max(0, totalProjected8Weeks - currentStock);

  // Insight narrative
  const weddingCount = events.filter(e => e.eventType === "wedding").length;
  const insight = `${activeRegistries} active registries are projecting ${totalProjectedRegistryUnits} additional units over the next 90 days \u2014 ${(registryShareOfDemand * 100).toFixed(0)}% of forecast demand. Peak registry week is ${peakRegistryWeek} driven by ${weddingCount} upcoming wedding${weddingCount !== 1 ? "s" : ""}.`;

  return {
    skuId,
    activeRegistries,
    totalProjectedRegistryUnits,
    registryRevenueAtStake,
    peakRegistryWeek,
    peakRegistryUnits,
    events,
    weeklyWave,
    registryShareOfDemand,
    inventoryGap,
    insight,
  };
}
