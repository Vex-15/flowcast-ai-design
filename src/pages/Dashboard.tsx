import { useRetailBrain } from "@/hooks/useRetailBrain";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ExecutiveView from "@/components/executive/ExecutiveView";
import SKUDeepDive from "@/components/skuDeepDive/SKUDeepDive";
import DemandView from "@/components/demand/DemandView";
import AnomalyPanel from "@/components/demand/AnomalyPanel";
import SignalsView from "@/components/signals/SignalsView";
import ReturnsView from "@/components/returns/ReturnsView";
import InventoryView from "@/components/inventory/InventoryView";
import SimulationView from "@/components/simulation/SimulationView";
import ExplainView from "@/components/explainability/ExplainView";
import CatalogIntelligenceView from "@/components/catalog/CatalogIntelligenceView";

const Dashboard = () => {
  const brain = useRetailBrain();

  const renderView = () => {
    switch (brain.activeView) {
      case "executive":
        return <ExecutiveView brain={brain} />;

      case "catalog-intelligence":
        return <CatalogIntelligenceView brain={brain} />;

      case "sku-deep-dive":
        return <SKUDeepDive brain={brain} />;

      case "demand":
        return (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DemandView
                forecast={brain.forecast}
                decomposition={brain.decomposition}
                skuName={brain.currentSKU.name}
              />
            </div>
            <div>
              <AnomalyPanel
                anomalies={brain.anomalies}
                intent={brain.intentAcceleration}
              />
            </div>
          </div>
        );

      case "signals":
        return (
          <SignalsView
            fusion={brain.signalFusion}
            intent={brain.intentAcceleration}
          />
        );

      case "returns":
        return (
          <ReturnsView
            data={brain.returnAnalysis}
            skuName={brain.currentSKU.name}
            returnExplanation={brain.returnExplanation}
          />
        );

      case "inventory":
        return (
          <InventoryView
            data={brain.inventoryDecision}
            skuName={brain.currentSKU.name}
          />
        );

      case "simulation":
        return (
          <SimulationView
            params={brain.simParams}
            onParamsChange={brain.setSimParams}
            result={brain.simulation}
            skuName={brain.currentSKU.name}
          />
        );

      case "explainability":
        return <ExplainView data={brain.explanation} />;

      default:
        return <ExecutiveView brain={brain} />;
    }
  };

  return (
    <DashboardLayout brain={brain}>
      {renderView()}
    </DashboardLayout>
  );
};

export default Dashboard;
