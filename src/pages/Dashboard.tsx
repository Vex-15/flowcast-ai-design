import { useRetailBrain } from "@/hooks/useRetailBrain";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ExecutiveView from "@/components/executive/ExecutiveView";
import SKUDeepDive from "@/components/skuDeepDive/SKUDeepDive";
import CatalogIntelligenceView from "@/components/catalog/CatalogIntelligenceView";
import PriceElasticityView from "@/components/pricing/PriceElasticityView";

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

      case "price-elasticity":
        return <PriceElasticityView brain={brain} />;

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
