import { useState } from "react";
import {
  Bell, X, Check, CheckCheck, TrendingUp, Undo2,
  AlertTriangle, Package, Zap, ChevronRight, Filter,
} from "lucide-react";
import type { DynamicNotification, NotificationSummary } from "@/data/types";

const typeIcons: Record<DynamicNotification["type"], typeof TrendingUp> = {
  demand_spike: TrendingUp,
  return_anomaly: Undo2,
  stockout_warning: AlertTriangle,
  overstock_alert: Package,
  forecast_drift: TrendingUp,
  intent_surge: Zap,
};

const typeLabels: Record<DynamicNotification["type"], string> = {
  demand_spike: "Demand Spike",
  return_anomaly: "Return Anomaly",
  stockout_warning: "Stockout Warning",
  overstock_alert: "Overstock Alert",
  forecast_drift: "Forecast Drift",
  intent_surge: "Intent Surge",
};

const priorityColors: Record<DynamicNotification["priority"], { bg: string; border: string; dot: string; text: string }> = {
  critical: { bg: "bg-red-500/[0.06]", border: "border-red-500/20", dot: "bg-red-500", text: "text-red-400" },
  high: { bg: "bg-amber-500/[0.06]", border: "border-amber-500/20", dot: "bg-amber-500", text: "text-amber-400" },
  medium: { bg: "bg-blue-500/[0.06]", border: "border-blue-500/20", dot: "bg-blue-500", text: "text-blue-400" },
  low: { bg: "bg-slate-500/[0.04]", border: "border-slate-500/15", dot: "bg-slate-400", text: "text-slate-400" },
};

const priorityLabels: Record<DynamicNotification["priority"], string> = {
  critical: "CRITICAL",
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
};

interface NotificationCenterProps {
  notifications: DynamicNotification[];
  summary: NotificationSummary;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDismiss: (id: string) => void;
  onNavigate: (notif: DynamicNotification) => void;
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter = ({
  notifications, summary, onMarkRead, onMarkAllRead,
  onDismiss, onNavigate, isOpen, onClose,
}: NotificationCenterProps) => {
  const [activeFilter, setActiveFilter] = useState<DynamicNotification["priority"] | "all">("all");

  const filtered = activeFilter === "all"
    ? notifications
    : notifications.filter(n => n.priority === activeFilter);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed top-0 right-0 z-50 h-screen w-[420px] bg-[hsl(228,14%,5%)] border-l border-border/30 
        shadow-2xl shadow-black/50 flex flex-col animate-slide-up"
        style={{ animationDuration: "200ms" }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/20 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center relative">
                <Bell className="w-4.5 h-4.5 text-primary" />
                {summary.unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
                    {summary.unread > 9 ? "9+" : summary.unread}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
                <p className="text-[10px] text-muted-foreground">{summary.unread} unread of {summary.total} total</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onMarkAllRead}
                className="p-1.5 rounded-lg hover:bg-secondary/40 transition-colors text-muted-foreground hover:text-foreground"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-secondary/40 transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Priority summary pills */}
          <div className="flex items-center gap-3 mb-3">
            {summary.critical > 0 && (
              <span className="flex items-center gap-1.5 text-[10px] font-medium text-red-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {summary.critical} Critical
              </span>
            )}
            {summary.high > 0 && (
              <span className="flex items-center gap-1.5 text-[10px] font-medium text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {summary.high} High
              </span>
            )}
            {summary.medium > 0 && (
              <span className="flex items-center gap-1.5 text-[10px] font-medium text-blue-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {summary.medium} Medium
              </span>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1">
            <Filter className="w-3 h-3 text-muted-foreground/40 mr-1" />
            {(["all", "critical", "high", "medium", "low"] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                  activeFilter === filter
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground/60 hover:text-foreground hover:bg-secondary/40"
                }`}
              >
                {filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/40">
              <Bell className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs">No notifications</p>
            </div>
          ) : (
            filtered.map((notif) => {
              const Icon = typeIcons[notif.type];
              const colors = priorityColors[notif.priority];
              return (
                <div
                  key={notif.id}
                  className={`group relative rounded-xl border p-3.5 transition-all duration-200 cursor-pointer
                    ${colors.bg} ${colors.border}
                    ${!notif.isRead ? "ring-1 ring-primary/10" : "opacity-75 hover:opacity-100"}
                    hover:scale-[1.01] hover:shadow-lg hover:shadow-black/20`}
                  onClick={() => onNavigate(notif)}
                >
                  {/* Unread indicator */}
                  {!notif.isRead && (
                    <div className={`absolute top-3 left-2 w-1.5 h-1.5 rounded-full ${colors.dot} animate-pulse`} />
                  )}

                  <div className="flex items-start gap-3 ml-2">
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${colors.text}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-foreground">{notif.title}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} border ${colors.border}`}>
                          {priorityLabels[notif.priority]}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{notif.message}</p>
                      
                      {/* Trigger rule */}
                      <div className="flex items-center gap-1 mb-2">
                        <span className="text-[9px] font-mono text-muted-foreground/40 bg-secondary/30 px-1.5 py-0.5 rounded">
                          {notif.triggerCondition}
                        </span>
                      </div>

                      {/* Action suggestion */}
                      <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-primary/[0.04] border border-primary/10">
                        <span className="text-[9px] text-primary/60 font-medium">💡 ACTION:</span>
                        <span className="text-[10px] text-muted-foreground/80">{notif.actionSuggestion}</span>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-muted-foreground/50">{notif.skuName}</span>
                          <span className="text-[9px] text-muted-foreground/30">•</span>
                          <span className="text-[9px] text-muted-foreground/40">{notif.timestamp}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notif.isRead && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onMarkRead(notif.id); }}
                              className="p-1 rounded hover:bg-secondary/50 transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-3 h-3 text-muted-foreground/50" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); onDismiss(notif.id); }}
                            className="p-1 rounded hover:bg-destructive/20 transition-colors"
                            title="Dismiss"
                          >
                            <X className="w-3 h-3 text-muted-foreground/50" />
                          </button>
                          <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

// ─── Notification Bell Button (for header) ─────────────────
export const NotificationBell = ({
  summary,
  onClick,
}: {
  summary: NotificationSummary;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="relative p-2 rounded-xl hover:bg-secondary/40 transition-all group"
    title={`${summary.unread} unread notifications`}
  >
    <Bell className="w-4.5 h-4.5 text-muted-foreground group-hover:text-foreground transition-colors" />
    {summary.unread > 0 && (
      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center px-1 shadow-lg shadow-red-500/30 animate-pulse">
        {summary.unread > 99 ? "99+" : summary.unread}
      </span>
    )}
    {summary.critical > 0 && (
      <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 animate-ping" />
    )}
  </button>
);

export default NotificationCenter;
