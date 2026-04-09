// ─── Brand & SKU ───────────────────────────────────────────
export interface Brand {
  id: string;
  name: string;
  shortName: string;
  color: string;       // HSL for charts
  icon: string;        // emoji fallback
}

export interface SKU {
  id: string;
  name: string;
  category: string;
  brand: string;       // Brand.id
  price: number;
  stores: string[];    // Store.id[]
  seasonalPeak: string[];  // e.g. ["holiday","spring"]
  returnRiskBase: number;  // 0–1
}

export interface Store {
  id: string;
  name: string;
  city: string;
  state: string;
}

// ─── Demand Intelligence ───────────────────────────────────
export interface ForecastPoint {
  day: string;          // "Mon", "Tue", …
  date: string;         // "Apr 10"
  actual?: number;
  predicted: number;
  lower: number;        // confidence band
  upper: number;
}

export interface DemandDecomposition {
  base: number;
  festivalBoost: number;
  promotionBoost: number;
  weatherImpact: number;
  total: number;
  label: string;        // day label
}

// ─── Anomaly Detection ─────────────────────────────────────
export interface AnomalyEvent {
  id: string;
  day: string;
  type: "spike" | "drop";
  predicted: number;
  actual: number;
  deviation: number;    // z-score
  severity: "critical" | "warning" | "info";
}

// ─── Signal Fusion ─────────────────────────────────────────
export interface SignalSource {
  name: string;
  type: "internal" | "external";
  value: number;        // 0–1 confidence
  trend: "up" | "down" | "stable";
  description: string;
}

export interface SignalFusionResult {
  combinedConfidence: number;
  signals: SignalSource[];
  narrative: string;     // "Demand spike likely due to…"
}

// ─── Intent Acceleration ───────────────────────────────────
export interface IntentSignal {
  metric: string;        // "saves", "views", "dwell_time"
  current: number;
  previous: number;
  changePercent: number;
  trending: "up" | "down" | "stable";
}

export interface IntentAccelerationResult {
  signals: IntentSignal[];
  spikePredicted: boolean;
  confidence: number;
  timeToSpike: string;   // "~2 days"
}

// ─── Return Intelligence ───────────────────────────────────
export interface ReturnReason {
  reason: string;
  percentage: number;
  count: number;
  trend: "up" | "down" | "stable";
}

export interface ReturnAnalysis {
  skuId: string;
  returnRate: number;
  riskScore: number;      // 0–100
  reasons: ReturnReason[];
  suggestedFixes: string[];
  phantomDemandGap: number;
  trueDemand: number;
  reportedDemand: number;
}

// ─── Inventory Decision ────────────────────────────────────
export interface InventoryDecision {
  skuId: string;
  currentStock: number;
  reorderQty: number;
  daysUntilStockout: number;
  stockoutRisk: number;    // 0–1
  overstockRisk: number;   // 0–1
  explanation: string[];   // bullet points
  storeBreakdown: StoreInventory[];
}

export interface StoreInventory {
  storeId: string;
  storeName: string;
  stock: number;
  daysSupply: number;
  status: "critical" | "low" | "ok" | "overstock";
}

// ─── Simulation ────────────────────────────────────────────
export interface SimulationParams {
  demandMultiplier: number;  // 0.5–3.0
  returnRateAdj: number;     // -50 to +50 %
  festivalActive: boolean;
  promotionIntensity: number; // 0–100
}

export interface SimulationResult {
  stockoutTimeline: { day: string; stock: number; demand: number }[];
  revenueImpact: number;
  revenueDelta: number;
  stockoutDay: number | null;
  storeImpacts: { store: string; status: string; daysSupply: number }[];
}

// ─── Explainability ────────────────────────────────────────
export interface FeatureImportance {
  feature: string;
  importance: number;   // 0–1
  direction: "positive" | "negative";
}

export interface Explanation {
  summary: string;
  factors: FeatureImportance[];
  confidence: number;
  narrative: string;     // full natural language
}

// ─── Orchestrator ──────────────────────────────────────────
export interface OrchestrationAlert {
  id: string;
  skuId: string;
  skuName: string;
  brand: string;
  type: "stockout" | "spike" | "return_anomaly" | "overstock" | "intent_signal";
  severity: "critical" | "warning" | "info";
  message: string;
  timestamp: string;
  actionRequired: boolean;
}

export interface SKUPriority {
  skuId: string;
  skuName: string;
  brand: string;
  priorityScore: number;  // 0–100
  riskFactors: string[];
  primaryConcern: string;
}

// ─── Dashboard KPIs ────────────────────────────────────────
export interface KPI {
  label: string;
  value: string;
  change: number;       // % vs previous period
  trend: "up" | "down" | "stable";
  icon: string;
}

export type DashboardView =
  | "executive"
  | "sku-deep-dive"
  | "demand"
  | "signals"
  | "returns"
  | "inventory"
  | "simulation"
  | "explainability";
