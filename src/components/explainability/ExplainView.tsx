import type { Explanation } from "@/data/types";

const ExplainView = ({ data }: { data: Explanation }) => {
  const maxImportance = Math.max(...data.factors.map((f) => f.importance));

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ─── Header ─── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-foreground">
            Explain<span className="font-semibold">ability</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{data.summary}</p>
        </div>
        <div className="text-right">
          <p className="text-5xl font-extralight tracking-tighter font-mono-data text-foreground leading-none">
            {(data.confidence * 100).toFixed(0)}
            <span className="text-lg text-muted-foreground/30 ml-0.5">%</span>
          </p>
          <p className="label-micro text-[9px] mt-1">MODEL CONFIDENCE</p>
        </div>
      </div>

      {/* ─── SHAP Force Plot ─── */}
      <div>
        <p className="label-micro text-[9px] mb-4">FEATURE IMPORTANCE</p>
        <div className="space-y-3">
          {data.factors.map((f) => {
            const width = (f.importance / maxImportance) * 100;
            const isPositive = f.direction === "positive";
            return (
              <div key={f.feature} className="group">
                <div className="flex items-center gap-4">
                  {/* Label */}
                  <span className="text-[12px] text-foreground/70 w-40 shrink-0 text-right">
                    {f.feature}
                  </span>

                  {/* Force bar */}
                  <div className="flex-1 flex items-center">
                    <div className="relative w-full h-8 flex items-center">
                      {/* Center line */}
                      <div className="absolute left-0 top-1/2 w-full h-px bg-border/20" />

                      {/* Bar */}
                      <div
                        className={`h-8 rounded-md transition-all duration-700 group-hover:opacity-100 opacity-75 relative ${
                          isPositive ? "bg-primary/20" : "bg-destructive/15"
                        }`}
                        style={{ width: `${width}%` }}
                      >
                        {/* Glow edge */}
                        <div
                          className={`absolute top-0 right-0 w-1 h-full rounded-r-md ${
                            isPositive ? "bg-primary/60" : "bg-destructive/50"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Value */}
                  <span className={`text-[12px] font-mono-data font-semibold w-12 text-right ${
                    isPositive ? "text-primary" : "text-destructive"
                  }`}>
                    {isPositive ? "+" : "-"}{(f.importance * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 ml-44">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-primary/30" />
            <span className="text-[10px] text-muted-foreground/50">Pushes demand up</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-destructive/20" />
            <span className="text-[10px] text-muted-foreground/50">Pushes demand down</span>
          </div>
        </div>
      </div>

      {/* ─── AI Narrative ─── */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-primary/[0.03] to-accent/[0.03] border-l-2 border-primary/25">
        <p className="label-micro text-[9px] mb-2">AI EXPLANATION</p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          {data.narrative}
        </p>
      </div>

      {/* ─── Confidence breakdown ─── */}
      <div>
        <p className="label-micro text-[9px] mb-3">CONFIDENCE BREAKDOWN</p>
        <div className="flex items-center gap-2">
          {/* Segmented bar */}
          <div className="flex-1 flex items-center gap-0.5 h-3 rounded-full overflow-hidden">
            {data.factors.map((f, i) => (
              <div
                key={i}
                className="h-full transition-all duration-500"
                style={{
                  width: `${(f.importance / data.factors.reduce((s, ff) => s + ff.importance, 0)) * 100}%`,
                  background: f.direction === "positive"
                    ? `hsl(217 91% ${50 + i * 8}%)`
                    : `hsl(0 72% ${45 + i * 6}%)`,
                  opacity: 0.6 + (1 - i / data.factors.length) * 0.4,
                }}
                title={`${f.feature}: ${(f.importance * 100).toFixed(0)}%`}
              />
            ))}
          </div>
          <span className="text-xs font-mono-data text-muted-foreground/50 w-12 text-right">
            {(data.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default ExplainView;
