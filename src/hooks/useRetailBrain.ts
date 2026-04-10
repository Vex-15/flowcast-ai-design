import { useState, useMemo, useCallback } from "react";
import type { DashboardView, SimulationParams, DynamicNotification, SKUTab } from "@/data/types";
import { skuCatalog, brands } from "@/data/brands";
import {
  generateDemandForecast,
  generateDemandDecomposition,
  generateAnomalies,
  generateSignalFusion,
  generateIntentAcceleration,
  generateReturnAnalysis,
  generateInventoryDecision,
  simulateWhatIf,
  generateExplanation,
  generateAlerts,
  generateSKUPriorities,
  generateKPIs,
  generateDynamicNotifications,
  getNotificationSummary,
  generateMigrationGraph,
  generateElasticity,
  generateRegistryDemand,
} from "@/data/generators";

const defaultSimParams: SimulationParams = {
  demandMultiplier: 1.0,
  returnRateAdj: 0,
  festivalActive: false,
  promotionIntensity: 0,
  demandFluctuation: 15,
  seasonalityMode: "none",
  externalTrendFactor: 0,
};

export function useRetailBrain() {
  const [activeView, setActiveView] = useState<DashboardView>("executive");
  const [activeTab, setActiveTab] = useState<SKUTab>("overview");
  const [selectedSKU, setSelectedSKU] = useState(skuCatalog[0].id);
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [simParams, setSimParams] = useState<SimulationParams>(defaultSimParams);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<DynamicNotification[]>(() => generateDynamicNotifications());
  const [showNotifications, setShowNotifications] = useState(false);

  // Filtered SKUs by brand
  const filteredSKUs = useMemo(() => {
    if (selectedBrand === "all") return skuCatalog;
    return skuCatalog.filter((s) => s.brand === selectedBrand);
  }, [selectedBrand]);

  // All module data for selected SKU
  const forecast = useMemo(() => generateDemandForecast(selectedSKU), [selectedSKU]);
  const decomposition = useMemo(() => generateDemandDecomposition(selectedSKU), [selectedSKU]);
  const anomalies = useMemo(() => generateAnomalies(selectedSKU), [selectedSKU]);
  const signalFusion = useMemo(() => generateSignalFusion(selectedSKU), [selectedSKU]);
  const intentAcceleration = useMemo(() => generateIntentAcceleration(selectedSKU), [selectedSKU]);
  const returnAnalysis = useMemo(() => generateReturnAnalysis(selectedSKU), [selectedSKU]);
  const inventoryDecision = useMemo(() => generateInventoryDecision(selectedSKU), [selectedSKU]);
  const simulation = useMemo(() => simulateWhatIf(selectedSKU, simParams), [selectedSKU, simParams]);
  const explanation = useMemo(() => generateExplanation(selectedSKU), [selectedSKU]);
  const returnExplanation = useMemo(() => generateExplanation(selectedSKU, "return_risk"), [selectedSKU]);
  const alerts = useMemo(() => generateAlerts(), []);
  const priorities = useMemo(() => generateSKUPriorities(), []);
  const kpis = useMemo(() => generateKPIs(), []);
  const notificationSummary = useMemo(() => getNotificationSummary(notifications), [notifications]);
  const migrationGraph = useMemo(() => generateMigrationGraph(), []);
  const elasticity = useMemo(() => generateElasticity(selectedSKU), [selectedSKU]);
  const registryDemand = useMemo(() => generateRegistryDemand(selectedSKU), [selectedSKU]);

  const selectSKUAndNavigate = useCallback((skuId: string, tab?: SKUTab) => {
    setSelectedSKU(skuId);
    setActiveView("sku-deep-dive");
    if (tab) setActiveTab(tab);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const markNotificationRead = useCallback((notifId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notifId ? { ...n, isRead: true } : n
    ));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const dismissNotification = useCallback((notifId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notifId));
  }, []);

  const navigateToNotification = useCallback((notif: DynamicNotification) => {
    markNotificationRead(notif.id);
    setSelectedSKU(notif.skuId);
    setActiveView(notif.relatedView);
    if (notif.relatedTab) setActiveTab(notif.relatedTab);
    setShowNotifications(false);
  }, [markNotificationRead]);

  return {
    // State
    activeView,
    setActiveView,
    activeTab,
    setActiveTab,
    selectedSKU,
    setSelectedSKU,
    selectedBrand,
    setSelectedBrand,
    simParams,
    setSimParams,
    sidebarCollapsed,
    toggleSidebar,
    showNotifications,
    setShowNotifications,

    // Computed
    filteredSKUs,
    brands,
    currentSKU: skuCatalog.find((s) => s.id === selectedSKU) || skuCatalog[0],

    // Module data
    forecast,
    decomposition,
    anomalies,
    signalFusion,
    intentAcceleration,
    returnAnalysis,
    inventoryDecision,
    simulation,
    explanation,
    returnExplanation,
    alerts,
    priorities,
    kpis,
    notifications,
    notificationSummary,
    migrationGraph,
    elasticity,
    registryDemand,

    // Actions
    selectSKUAndNavigate,
    markNotificationRead,
    markAllNotificationsRead,
    dismissNotification,
    navigateToNotification,
  };
}

export type RetailBrainState = ReturnType<typeof useRetailBrain>;
