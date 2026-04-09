import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import type { RetailBrainState } from "@/hooks/useRetailBrain";
import NotificationCenter, { NotificationBell } from "@/components/notifications/NotificationCenter";

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

          {/* Dynamic Notification Bell */}
          <NotificationBell
            summary={brain.notificationSummary}
            onClick={() => brain.setShowNotifications(true)}
          />
        </header>

        {/* Content */}
        <main className="p-6 max-w-[1400px]">
          {children}
        </main>
      </div>

      {/* Notification Center Overlay */}
      <NotificationCenter
        notifications={brain.notifications}
        summary={brain.notificationSummary}
        onMarkRead={brain.markNotificationRead}
        onMarkAllRead={brain.markAllNotificationsRead}
        onDismiss={brain.dismissNotification}
        onNavigate={brain.navigateToNotification}
        isOpen={brain.showNotifications}
        onClose={() => brain.setShowNotifications(false)}
      />
    </div>
  );
};

export default DashboardLayout;
