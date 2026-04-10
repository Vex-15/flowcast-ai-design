import type { MigrationNode, DemandMigrationGraph } from "@/data/types";
import { getBrand } from "@/data/brands";
import { ArrowRight, Ban, Zap, Clock } from "lucide-react";

export default function MigrationEdgeDetails({ node, graph, onSKUClick }: { node: MigrationNode; graph: DemandMigrationGraph; onSKUClick: (id: string) => void }) {
  const brand = getBrand(node.brand);
  const isCritical = node.stockStatus === "critical" || node.stockStatus === "low";
  
  // Calculate outgoing edges
  const outgoing = graph.edges.filter(e => e.fromSkuId === node.skuId).sort((a,b) => b.probability - a.probability);
  const totalOutgoingDemand = node.weeklyDemandValue;
  
  return (
    <div className="bg-card border border-border/20 rounded-2xl p-5 space-y-6 h-full shadow-sm">
       <div>
           <div className="flex items-center gap-2 mb-2">
               <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: `hsl(${brand.color} / 0.15)`, color: `hsl(${brand.color})` }}>
                  {brand.shortName}
               </span>
               <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${isCritical ? 'bg-destructive/15 text-destructive' : 'bg-emerald-500/15 text-emerald-500'}`}>
                  {node.stockStatus === "critical" ? "Critical Stock" : node.stockStatus === "low" ? "Low Stock" : "Healthy Stock"}
               </span>
           </div>
           <h3 className="text-xl font-semibold text-foreground tracking-tight leading-tight cursor-pointer hover:text-primary transition-colors" onClick={() => onSKUClick(node.skuId)}>
              {node.skuName}
           </h3>
           <p className="text-xs text-muted-foreground mt-1">Category: {node.category}</p>
       </div>
       
       <div className="p-4 bg-secondary/30 rounded-xl border border-border/30">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-medium">Weekly Demand Value</p>
          <p className="text-2xl font-light font-mono-data text-foreground">${node.weeklyDemandValue.toLocaleString()}</p>
          {isCritical && (
              <p className="text-[10px] text-destructive tracking-wide mt-1">Currently at risk due to stock status</p>
          )}
       </div>

       {/* Outgoing Migration Info if node is source */}
       {outgoing.length > 0 && (
           <div>
               <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-amber-500" /> Absorption Breakdown
               </h4>
               <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                  When this SKU stocks out, historically its demand migrates to the following alternatives:
               </p>

               <div className="flex h-3 rounded-full overflow-hidden mb-4 bg-secondary/50">
                   {outgoing.map((edge, i) => (
                       <div key={edge.toSkuId} className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${edge.probability * 100}%`, filter: `brightness(${1 - i*0.1})` }} />
                   ))}
                   {node.lostProbability > 0 && <div className="h-full bg-destructive/80 transition-all duration-500" style={{ width: `${node.lostProbability * 100}%` }} />}
                   {node.deferredProbability > 0 && <div className="h-full bg-amber-500/80 transition-all duration-500" style={{ width: `${node.deferredProbability * 100}%` }} />}
               </div>
               
               <div className="space-y-1.5 custom-scrollbar max-h-[240px] overflow-y-auto pr-1">
                   {outgoing.map(edge => {
                       const target = graph.nodes.find(n => n.skuId === edge.toSkuId);
                       if (!target) return null;
                       const targetBrand = getBrand(target.brand);
                       return (
                           <div key={edge.toSkuId} className="flex items-center justify-between group cursor-pointer hover:bg-secondary/60 p-2 -mx-2 rounded-lg transition-colors border border-transparent hover:border-border/30" onClick={() => onSKUClick(target.skuId)}>
                               <div className="flex items-center gap-2.5">
                                  <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                                     <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                                  </div>
                                  <div className="max-w-[150px]">
                                     <p className="text-xs text-foreground font-medium truncate group-hover:text-primary transition-colors">{target.skuName}</p>
                                     <p className="text-[10px] text-muted-foreground truncate opacity-80" style={{ color: `hsl(${targetBrand.color})` }}>{targetBrand.name}</p>
                                  </div>
                               </div>
                               <div className="text-right shrink-0">
                                   <p className="text-xs font-mono-data font-semibold text-emerald-400">{(edge.probability * 100).toFixed(0)}%</p>
                                   <p className="text-[10px] text-muted-foreground">${edge.weeklyDemandAtRisk.toLocaleString()}</p>
                               </div>
                           </div>
                       )
                   })}
                   
                   {/* Lost Demand */}
                   {node.lostProbability > 0 && (
                      <div className="flex items-center justify-between p-2 -mx-2">
                          <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-md bg-destructive/10 flex items-center justify-center shrink-0">
                                 <Ban className="w-3.5 h-3.5 text-destructive" />
                              </div>
                             <p className="text-xs text-foreground font-medium">Lost Demand</p>
                          </div>
                          <div className="text-right">
                              <p className="text-xs font-mono-data font-semibold text-destructive">{(node.lostProbability * 100).toFixed(0)}%</p>
                              <p className="text-[10px] text-muted-foreground">${Math.round(node.weeklyDemandValue * node.lostProbability).toLocaleString()}</p>
                          </div>
                      </div>
                   )}

                   {/* Deferred Demand */}
                   {node.deferredProbability > 0 && (
                      <div className="flex items-center justify-between p-2 -mx-2">
                          <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
                                 <Clock className="w-3.5 h-3.5 text-amber-500" />
                              </div>
                             <p className="text-xs text-foreground font-medium">Deferred Demand</p>
                          </div>
                          <div className="text-right">
                              <p className="text-xs font-mono-data font-semibold text-amber-500">{(node.deferredProbability * 100).toFixed(0)}%</p>
                              <p className="text-[10px] text-muted-foreground">${Math.round(node.weeklyDemandValue * node.deferredProbability).toLocaleString()}</p>
                          </div>
                      </div>
                   )}
               </div>
           </div>
       )}

       {/* Incoming Migration Info if node is absorber */}
       {node.incomingEdges.length > 0 && (
          <div className="pt-4 border-t border-border/20">
             <h4 className="text-xs font-semibold text-foreground mb-2">Absorbs Demand From:</h4>
             <div className="flex flex-wrap gap-1.5">
                {node.incomingEdges.map((e, idx) => {
                   const src = graph.nodes.find(n => n.skuId === e.fromSkuId);
                   if(!src) return null;
                   return (
                      <div key={idx} className="px-2 py-1 bg-secondary/50 rounded-md text-[10px] text-muted-foreground flex items-center gap-1.5">
                         <span className={`w-1.5 h-1.5 rounded-full ${src.stockStatus === 'critical' ? 'bg-destructive animate-pulse' : 'bg-emerald-500'}`} />
                         {src.skuName}
                      </div>
                   )
                })}
             </div>
          </div>
       )}
    </div>
  );
}
