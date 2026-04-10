import {
  LayoutDashboard, Search, BarChart3, Radio, Undo2,
  Package, FlaskConical, Brain, ChevronLeft, ChevronRight, Activity, Network, TrendingDown
} from "lucide-react";
import type { DashboardView, Brand } from "@/data/types";

interface SidebarProps {
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  collapsed: boolean;
  onToggle: () => void;
  selectedBrand: string;
  onBrandChange: (brand: string) => void;
  brands: Brand[];
}

const navItems: { view: DashboardView; label: string; icon: typeof LayoutDashboard }[] = [
  { view: "executive",            label: "Overview",         icon: LayoutDashboard },
  { view: "catalog-intelligence", label: "Catalog Intel",    icon: Network },
  { view: "sku-deep-dive",        label: "SKU Workspace",    icon: Search },
  { view: "price-elasticity",     label: "Price Elasticity", icon: TrendingDown },
];

const Sidebar = ({
  activeView, onViewChange, collapsed, onToggle,
  selectedBrand, onBrandChange, brands,
}: SidebarProps) => {
  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-40 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${collapsed ? "w-[68px]" : "w-[240px]"}
        bg-sidebar border-r border-border/30`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center shrink-0">
          <Activity className="w-4 h-4 text-primary" />
        </div>
        {!collapsed && (
          <span className="text-[15px] font-semibold tracking-tight text-foreground whitespace-nowrap">
            Retail<span className="text-primary">Brain</span>
          </span>
        )}
      </div>

      {/* Brand filter */}
      {!collapsed && (
        <div className="px-3 pb-2">
          <select
            value={selectedBrand}
            onChange={(e) => onBrandChange(e.target.value)}
            className="w-full bg-transparent border border-border/30 rounded-lg px-2.5 py-1.5 text-[11px] text-muted-foreground
              focus:outline-none focus:border-primary/40 cursor-pointer appearance-none hover:text-foreground transition-colors"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
          >
            <option value="all">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Divider */}
      <div className="mx-3 border-t border-border/20" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 custom-scrollbar">
        {navItems.map((item) => {
          const isActive = activeView === item.view;
          const Icon = item.icon;
          return (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              className={`w-full flex items-center gap-2.5 rounded-lg transition-all duration-150
                ${collapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2"}
                ${isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
              {!collapsed && (
                <span className={`text-[13px] ${isActive ? "font-semibold" : "font-normal"}`}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse */}
      <div className="px-2 py-2 border-t border-border/15">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-muted-foreground/60
            hover:text-foreground hover:bg-secondary/40 transition-all text-xs"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          {!collapsed && <span className="text-[11px]">Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
