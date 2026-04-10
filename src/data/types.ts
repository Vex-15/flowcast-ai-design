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
  riskLabel: "Low" | "Medium" | "High";
  reasons: ReturnReason[];
  suggestedFixes: string[];
  phantomDemandGap: number;
  trueDemand: number;
  reportedDemand: number;
  // ─── NEW: Return Risk Prediction ───
  riskFactors: ReturnRiskFactor[];
  returnExplanation: string;      // Natural language explanation
  categoryAvgReturn: number;      // Category average return rate
  historicalTrend: ReturnTrendPoint[];  // 6-month return trend
}

export interface ReturnRiskFactor {
  name: string;
  weight: number;       // 0–1 contribution
  value: string;        // display value
  impact: "high" | "medium" | "low";
  direction: "increases_risk" | "decreases_risk";
}

export interface ReturnTrendPoint {
  month: string;
  rate: number;
  volume: number;
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
  // ─── NEW: Enhanced simulation params ───
  demandFluctuation: number;   // 0–100 (variance %)
  seasonalityMode: "none" | "spring" | "summer" | "holiday" | "back-to-school";
  externalTrendFactor: number; // -50 to +50  
}

export interface SimulationResult {
  stockoutTimeline: { day: string; stock: number; demand: number }[];
  revenueImpact: number;
  revenueDelta: number;
  stockoutDay: number | null;
  storeImpacts: { store: string; status: string; daysSupply: number }[];
  // ─── NEW: Enhanced simulation results ───
  profitLoss: ProfitLossResult;
  returnImpact: ReturnImpactResult;
  forecastComparison: ForecastComparisonPoint[];
  confidenceInterval: { day: string; lower: number; upper: number; mean: number }[];
}

export interface ProfitLossResult {
  grossRevenue: number;
  returnCost: number;
  holdingCost: number;
  stockoutLoss: number;
  netProfit: number;
  netProfitBaseline: number;
  profitDelta: number;
  margin: number;
}

export interface ReturnImpactResult {
  totalReturns: number;
  returnCostDollars: number;
  effectiveReturnRate: number;
  returnsByReason: { reason: string; count: number; cost: number }[];
}

export interface ForecastComparisonPoint {
  day: string;
  baseline: number;
  simulated: number;
  returnAdjusted: number;
}

// ─── Explainability ────────────────────────────────────────
export interface FeatureImportance {
  feature: string;
  importance: number;   // 0–1
  direction: "positive" | "negative";
  description: string;   // NEW: human-readable explanation
}

export interface Explanation {
  summary: string;
  factors: FeatureImportance[];
  confidence: number;
  narrative: string;     // full natural language
  // ─── NEW: Enhanced explainability ───
  confidenceBreakdown: ConfidenceBreakdown;
  predictionContext: "forecast" | "return_risk" | "inventory";
  naturalLanguageReasons: string[];   // bullet-point reasons
}

export interface ConfidenceBreakdown {
  overall: number;       // 0–1
  dataQuality: number;   // 0–1
  historicalConsistency: number;  // 0–1
  varianceScore: number; // 0–1
  modelFit: number;      // 0–1
  sampleSize: number;    // 0–1 (normalized)
  segments: ConfidenceSegment[];
}

export interface ConfidenceSegment {
  label: string;
  value: number;     // 0–1
  color: string;     // HSL
  description: string;
}

// ─── Dynamic Notifications ─────────────────────────────────
export interface DynamicNotification {
  id: string;
  type: "demand_spike" | "return_anomaly" | "stockout_warning" | "overstock_alert" | "forecast_drift" | "intent_surge";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  skuId: string;
  skuName: string;
  brand: string;
  triggerCondition: string;    // human-readable rule
  triggerValue: number;        // actual metric value
  threshold: number;           // threshold that was exceeded
  timestamp: string;
  isRead: boolean;
  actionSuggestion: string;
  icon: string;                // lucide icon name
  relatedView: DashboardView;  // which view to navigate to
}

export interface NotificationSummary {
  total: number;
  unread: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  byType: Record<DynamicNotification["type"], number>;
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
  // ─── NEW: Migration Risk ───
  migrationRisk: "high_absorber" | "source_at_risk" | "dual_risk" | "none";
  migrationRiskScore: number;   // 0–100
  absorbsFromSkus: string[];    // SKU IDs this SKU absorbs demand from
  sendsToSkus: string[];        // SKU IDs this SKU sends demand to when OOS
}

// ─── Dashboard KPIs ────────────────────────────────────────
export interface KPI {
  label: string;
  value: string;
  change: number;       // % vs previous period
  trend: "up" | "down" | "stable";
  icon: string;
}

// ─── Demand Migration Network ──────────────────────────────
export interface MigrationEdge {
  fromSkuId: string;
  toSkuId: string;
  probability: number;           // 0–1 fraction of demand that flows
  weeklyDemandAtRisk: number;    // $ value
  historicalAbsorptionRate: number; // 0–1 confidence in this edge
  isActive: boolean;             // true when source is critical/low stock
}

export interface MigrationNode {
  skuId: string;
  skuName: string;
  brand: string;
  category: string;
  revenueVelocity: number;       // weekly $ revenue (sizes the node)
  stockStatus: "critical" | "low" | "ok" | "overstock";
  daysSupply: number;
  weeklyDemandValue: number;     // $ at stake if this node goes OOS
  // edges this node participates in
  outgoingEdges: MigrationEdge[]; // if this SKU goes OOS, demand flows here
  incomingEdges: MigrationEdge[]; // demand from other OOS SKUs flows here
  lostProbability: number;        // 0–1 fraction lost when OOS
  deferredProbability: number;    // 0–1 fraction deferred when OOS
  // layout (set by force simulation)
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface DemandMigrationGraph {
  nodes: MigrationNode[];
  edges: MigrationEdge[];
  totalWeeklyDemandAtRisk: number;  // $ across all critical/low SKUs
  criticalNodeCount: number;
  lostDemandEstimate: number;        // $ lost if all critical nodes stock out
  absorbedDemandEstimate: number;    // $ that can be captured by substitutes
}

export type DashboardView =
  | "executive"
  | "sku-deep-dive"
  | "demand"
  | "signals"
  | "returns"
  | "inventory"
  | "simulation"
  | "explainability"
  | "catalog-intelligence";
