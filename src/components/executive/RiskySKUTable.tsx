import { getBrand } from "@/data/brands";
import type { SKUPriority } from "@/data/types";

const RiskySKUTable = ({
  priorities,
  onSKUClick,
}: {
  priorities: SKUPriority[];
  onSKUClick: (skuId: string) => void;
}) => {
  const top = priorities.slice(0, 8);

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Top Risk SKUs</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Ranked by composite priority score</p>
        </div>
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">
          {top.length} items
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/30">
              <th className="text-left text-muted-foreground/70 font-medium pb-2 pr-3">#</th>
              <th className="text-left text-muted-foreground/70 font-medium pb-2 pr-3">SKU</th>
              <th className="text-left text-muted-foreground/70 font-medium pb-2 pr-3">Brand</th>
              <th className="text-left text-muted-foreground/70 font-medium pb-2 pr-3">Risk Score</th>
              <th className="text-left text-muted-foreground/70 font-medium pb-2">Primary Concern</th>
            </tr>
          </thead>
          <tbody>
            {top.map((item, i) => {
              const brand = getBrand(item.brand);
              const scoreColor =
                item.priorityScore > 70
                  ? "text-destructive"
                  : item.priorityScore > 45
                  ? "text-amber-400"
                  : "text-emerald-400";

              return (
                <tr
                  key={item.skuId}
                  onClick={() => onSKUClick(item.skuId)}
                  className="border-b border-border/10 hover:bg-secondary/20 cursor-pointer transition-colors group"
                >
                  <td className="py-2.5 pr-3 text-muted-foreground/50 tabular-nums">{i + 1}</td>
                  <td className="py-2.5 pr-3">
                    <span className="text-foreground font-medium group-hover:text-primary transition-colors">
                      {item.skuName}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium"
                      style={{
                        background: `hsl(${brand.color} / 0.15)`,
                        color: `hsl(${brand.color})`,
                      }}
                    >
                      {brand.shortName}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${item.priorityScore}%`,
                            background: item.priorityScore > 70
                              ? "hsl(0 70% 55%)"
                              : item.priorityScore > 45
                              ? "hsl(38 90% 55%)"
                              : "hsl(160 60% 45%)",
                          }}
                        />
                      </div>
                      <span className={`${scoreColor} font-semibold tabular-nums`}>
                        {item.priorityScore}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 text-muted-foreground">{item.primaryConcern}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RiskySKUTable;
