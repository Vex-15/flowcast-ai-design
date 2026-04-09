import { ReactNode } from "react";
import { Bell } from "lucide-react";
import Sidebar from "./Sidebar";
import type { RetailBrainState } from "@/hooks/useRetailBrain";

interface DashboardLayoutProps {
  brain: RetailBrainState;
  children: ReactNode;
}

const DashboardLayout = ({ brain, children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        activeView={brain.activeView}
        onViewChange={brain.setActiveView}
        collapsed={brain.sidebarCollapsed}
        onToggle={brain.toggleSidebar}
        selectedBrand={brain.selectedBrand}
        onBrandChange={brain.setSelectedBrand}
        brands={brain.brands}
      />

      <div className={`transition-all duration-300 ${brain.sidebarCollapsed ? "ml-[68px]" : "ml-[240px]"}`}>
        {/* Minimal top bar */}
        <header className="sticky top-0 z-30 h-12 flex items-center justify-end gap-3 px-6 bg-background/90 backdrop-blur-lg border-b border-border/15">
          {/* SKU selector */}
          <select
            value={brain.selectedSKU}
            onChange={(e) => brain.setSelectedSKU(e.target.value)}
            className="bg-transparent border border-border/25 rounded-lg px-3 py-1.5 text-[11px] text-muted-foreground
              focus:outline-none focus:border-primary/40 max-w-[200px] appearance-none cursor-pointer hover:text-foreground transition-colors"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', paddingRight: '28px' }}
          >
            {brain.filteredSKUs.map((sku) => (
              <option key={sku.id} value={sku.id}>{sku.name}</option>
            ))}
          </select>

          <button className="relative w-8 h-8 rounded-lg flex items-center justify-center
            hover:bg-secondary/50 transition-all group">
            <Bell className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            {brain.alerts.filter((a) => a.severity === "critical").length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-destructive text-[8px] font-bold
                flex items-center justify-center text-white">
                {brain.alerts.filter((a) => a.severity === "critical").length}
              </span>
            )}
          </button>
        </header>

        {/* Content */}
        <main className="p-6 max-w-[1400px]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
