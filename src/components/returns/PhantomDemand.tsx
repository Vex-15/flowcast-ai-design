import { Ghost } from "lucide-react";
import type { ReturnAnalysis } from "@/data/types";

const PhantomDemand = ({ data }: { data: ReturnAnalysis }) => {
  const gapPct = ((data.phantomDemandGap / data.reportedDemand) * 100).toFixed(1);
  const trueWidth = (data.trueDemand / data.reportedDemand) * 100;
  const phantomWidth = (data.phantomDemandGap / data.reportedDemand) * 100;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
          <Ghost className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Phantom Demand Correction</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Actual demand ≠ real demand for high-return products
          </p>
        </div>
      </div>

      {/* Formula */}
      <div className="p-4 rounded-xl bg-secondary/30 border border-border/20 mb-5">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Formula</p>
        <div className="text-sm text-foreground font-mono">
          <span className="text-emerald-400">True Demand</span>
          {" = "}
          <span className="text-primary">Sales</span>
          {" − ("}
          <span className="text-amber-400">Return Probability</span>
          {" × "}
          <span className="text-primary">Sales</span>
          {")"}
        </div>
        <div className="text-sm text-foreground font-mono mt-2">
          <span className="text-emerald-400">{data.trueDemand}</span>
          {" = "}
          <span className="text-primary">{data.reportedDemand}</span>
          {" − ("}
          <span className="text-amber-400">{(data.returnRate * 100).toFixed(1)}%</span>
          {" × "}
          <span className="text-primary">{data.reportedDemand}</span>
          {") = "}
          <span className="text-emerald-400 font-bold">{data.trueDemand}</span>
        </div>
      </div>

      {/* Visual bar */}
      <div className="mb-4">
        <div className="flex items-center gap-0 h-10 rounded-xl overflow-hidden">
          <div
            className="h-full flex items-center justify-center text-xs font-semibold text-foreground bg-emerald-500/25 border-r border-background/50"
            style={{ width: `${trueWidth}%` }}
          >
            True: {data.trueDemand}
          </div>
          <div
            className="h-full flex items-center justify-center text-xs font-semibold text-foreground bg-destructive/20"
            style={{ width: `${phantomWidth}%` }}
          >
            Phantom: {data.phantomDemandGap}
          </div>
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
          <span>Real Demand</span>
          <span>Phantom Gap ({gapPct}%)</span>
        </div>
      </div>

      {/* Insight */}
      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="text-amber-400 font-semibold">⚡ Insight:</span>{" "}
          {data.phantomDemandGap > 15
            ? `This SKU has significant phantom demand. ${gapPct}% of apparent demand is inflated by returns. Adjust reorder quantities downward to prevent overstock.`
            : "Phantom demand gap is minimal. Return-adjusted forecasts are close to reported sales."}
        </p>
      </div>
    </div>
  );
};

export default PhantomDemand;
