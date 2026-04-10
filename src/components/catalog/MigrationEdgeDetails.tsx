import type { MigrationNode, DemandMigrationGraph } from "@/data/types";
import { getBrand } from "@/data/brands";
import { ArrowRight, Ban, Zap, Clock, ExternalLink, Package, TrendingUp } from "lucide-react";

export default function MigrationEdgeDetails({ node, graph, onSKUClick }: { node: MigrationNode; graph: DemandMigrationGraph; onSKUClick: (id: string) => void }) {
  const brand = getBrand(node.brand);
  const isCritical = node.stockStatus === "critical" || node.stockStatus === "low";
  
  // Calculate outgoing edges
  const outgoing = graph.edges.filter(e => e.fromSkuId === node.skuId).sort((a,b) => b.probability - a.probability);

  const stockStatusConfig = {
    critical: { label: "Critical Stock", class: "bg-destructive/12 text-destructive border-destructive/20" },
    low: { label: "Low Stock", class: "bg-amber-500/12 text-amber-400 border-amber-500/20" },
    ok: { label: "Healthy", class: "bg-emerald-500/12 text-emerald-400 border-emerald-500/20" },
    overstock: { label: "Overstock", class: "bg-blue-500/12 text-blue-400 border-blue-500/20" },
  };

  const statusConfig = stockStatusConfig[node.stockStatus] || stockStatusConfig.ok;
  
  return (
    <div className="bg-card/80 backdrop-blur-xl border border-border/20 rounded-2xl shadow-lg h-full flex flex-col overflow-hidden">
       {/* Header Section */}
       <div className="p-5 pb-4 border-b border-border/10">
           <div className="flex items-center gap-2 mb-3 flex-wrap">
               <span 
                 className="px-2.5 py-1 rounded-md text-[10px] font-semibold border" 
                 style={{ 
                   background: `hsl(${brand.color} / 0.1)`, 
                   color: `hsl(${brand.color})`,
                   borderColor: `hsl(${brand.color} / 0.2)` 
                 }}
               >
                  {brand.shortName}
               </span>
               <span className={`px-2.5 py-1 rounded-md text-[10px] font-semibold border ${statusConfig.class}`}>
                  {statusConfig.label}
               </span>
               <span className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-secondary/40 text-muted-foreground border border-border/20">
                  {node.daysSupply}d supply
               </span>
           </div>
           <h3 
             className="text-lg font-semibold text-foreground tracking-tight leading-tight cursor-pointer hover:text-primary transition-colors group flex items-center gap-1.5" 
             onClick={() => onSKUClick(node.skuId)}
           >
              {node.skuName}
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
           </h3>
           <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
              <Package className="w-3 h-3" /> {node.category}
           </p>
       </div>

       {/* Scrollable content area */}
       <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
         {/* Weekly Demand Card */}
         <div className="p-4 rounded-xl border border-border/15"
              style={{ background: 'linear-gradient(135deg, hsl(var(--secondary) / 0.5), hsl(var(--secondary) / 0.2))' }}>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" />
              Weekly Demand Value
            </p>
            <p className="text-2xl font-light font-mono-data text-foreground">${node.weeklyDemandValue.toLocaleString()}</p>
            {isCritical && (
                <p className="text-[10px] text-destructive tracking-wide mt-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                  Currently at risk due to stock status
                </p>
            )}
         </div>

         {/* Outgoing Migration Breakdown */}
         {outgoing.length > 0 && (
             <div>
                 <h4 className="text-xs font-semibold text-foreground flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center">
                      <Zap className="w-3 h-3 text-amber-500" />
                    </div>
                    Absorption Breakdown
                 </h4>
                 <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">
                    When this SKU stocks out, demand migrates to these alternatives:
                 </p>

                 {/* Stacked bar with labels */}
                 <div className="mb-4">
                   <div className="flex h-2.5 rounded-full overflow-hidden bg-secondary/30">
                       {outgoing.map((edge, i) => (
                           <div 
                             key={edge.toSkuId} 
                             className="h-full transition-all duration-500" 
                             style={{ 
                               width: `${edge.probability * 100}%`, 
                               background: `hsl(152 69% ${45 - i * 8}%)`,
                             }}
                             title={`${(edge.probability * 100).toFixed(0)}%`}
                           />
                       ))}
                       {node.lostProbability > 0 && (
                         <div className="h-full bg-destructive/70 transition-all duration-500" style={{ width: `${node.lostProbability * 100}%` }} />
                       )}
                       {node.deferredProbability > 0 && (
                         <div className="h-full bg-amber-500/60 transition-all duration-500" style={{ width: `${node.deferredProbability * 100}%` }} />
                       )}
                   </div>
                   <div className="flex justify-between mt-1.5">
                     <span className="text-[9px] text-emerald-400/80">Absorbed</span>
                     <span className="text-[9px] text-muted-foreground/50">{(outgoing.reduce((s, e) => s + e.probability, 0) * 100).toFixed(0)}% total</span>
                   </div>
                 </div>
                 
                 {/* Migration targets list */}
                 <div className="space-y-1 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                     {outgoing.map(edge => {
                         const target = graph.nodes.find(n => n.skuId === edge.toSkuId);
                         if (!target) return null;
                         const targetBrand = getBrand(target.brand);
                         return (
                             <div 
                               key={edge.toSkuId} 
                               className="flex items-center justify-between group cursor-pointer hover:bg-secondary/40 p-2.5 rounded-lg transition-all duration-200 border border-transparent hover:border-border/20" 
                               onClick={() => onSKUClick(target.skuId)}
                             >
                                 <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                                       <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                                    </div>
                                    <div className="min-w-0">
                                       <p className="text-xs text-foreground font-medium truncate group-hover:text-primary transition-colors">{target.skuName}</p>
                                       <p className="text-[10px] truncate opacity-70" style={{ color: `hsl(${targetBrand.color})` }}>{targetBrand.name}</p>
                                    </div>
                                 </div>
                                 <div className="text-right shrink-0 ml-2">
                                     <p className="text-xs font-mono-data font-semibold text-emerald-400">{(edge.probability * 100).toFixed(0)}%</p>
                                     <p className="text-[10px] text-muted-foreground font-mono-data">${edge.weeklyDemandAtRisk.toLocaleString()}</p>
                                 </div>
                             </div>
                         )
                     })}
                     
                     {/* Divider before lost/deferred */}
                     {(node.lostProbability > 0 || node.deferredProbability > 0) && (
                       <div className="border-t border-border/10 my-1.5" />
                     )}

                     {/* Lost Demand */}
                     {node.lostProbability > 0 && (
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-destructive/5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                                   <Ban className="w-3.5 h-3.5 text-destructive" />
                                </div>
                               <p className="text-xs text-foreground font-medium">Lost Demand</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-mono-data font-semibold text-destructive">{(node.lostProbability * 100).toFixed(0)}%</p>
                                <p className="text-[10px] text-muted-foreground font-mono-data">${Math.round(node.weeklyDemandValue * node.lostProbability).toLocaleString()}</p>
                            </div>
                        </div>
                     )}

                     {/* Deferred Demand */}
                     {node.deferredProbability > 0 && (
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                                   <Clock className="w-3.5 h-3.5 text-amber-500" />
                                </div>
                               <p className="text-xs text-foreground font-medium">Deferred Demand</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-mono-data font-semibold text-amber-500">{(node.deferredProbability * 100).toFixed(0)}%</p>
                                <p className="text-[10px] text-muted-foreground font-mono-data">${Math.round(node.weeklyDemandValue * node.deferredProbability).toLocaleString()}</p>
                            </div>
                        </div>
                     )}
                 </div>
             </div>
         )}

         {/* Incoming Migration — "Absorbs From" */}
         {node.incomingEdges.length > 0 && (
            <div className="pt-4 border-t border-border/15">
               <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                 <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
                    <ArrowRight className="w-3 h-3 text-primary rotate-180" />
                 </div>
                 Absorbs Demand From
               </h4>
               <div className="flex flex-wrap gap-2">
                  {node.incomingEdges.map((e, idx) => {
                     const src = graph.nodes.find(n => n.skuId === e.fromSkuId);
                     if(!src) return null;
                     const srcBrand = getBrand(src.brand);
                     return (
                        <div 
                          key={idx} 
                          className="px-3 py-1.5 rounded-lg text-[10px] text-foreground/80 flex items-center gap-2 border border-border/15 hover:border-border/30 transition-colors cursor-default"
                          style={{ background: `hsl(${srcBrand.color} / 0.06)` }}
                        >
                           <span className={`w-2 h-2 rounded-full ${src.stockStatus === 'critical' ? 'bg-destructive animate-pulse' : src.stockStatus === 'low' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                           <span className="font-medium">{src.skuName.length > 20 ? src.skuName.slice(0, 18) + "…" : src.skuName}</span>
                        </div>
                     )
                  })}
               </div>
            </div>
         )}
       </div>
    </div>
  );
}
