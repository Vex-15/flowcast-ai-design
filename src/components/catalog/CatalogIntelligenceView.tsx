import { useState, useMemo } from "react";
import type { RetailBrainState } from "@/hooks/useRetailBrain";
import type { MigrationNode, DemandMigrationGraph } from "@/data/types";
import MigrationNetworkGraph from "./MigrationNetworkGraph";
import MigrationEdgeDetails from "./MigrationEdgeDetails";
import { Network, AlertTriangle } from "lucide-react";

export default function CatalogIntelligenceView({ brain }: { brain: RetailBrainState }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedNode, setSelectedNode] = useState<MigrationNode | null>(null);

  const categories = useMemo(() => {
     const cats = new Set(brain.migrationGraph.nodes.map(n => n.category));
     return Array.from(cats).sort();
  }, [brain.migrationGraph]);

  const viewGraph = useMemo(() => {
    if (selectedCategory === "all") return brain.migrationGraph;
    
    // Filter nodes and edges by category
    const filteredNodes = brain.migrationGraph.nodes.filter(n => n.category === selectedCategory);
    const filteredEdges = brain.migrationGraph.edges.filter(e => {
        const fromNode = filteredNodes.find(n => n.skuId === e.fromSkuId);
        const toNode = filteredNodes.find(n => n.skuId === e.toSkuId);
        return fromNode && toNode;
    });
    
    return {
      nodes: filteredNodes,
      edges: filteredEdges,
      totalWeeklyDemandAtRisk: filteredNodes.filter(n => n.stockStatus === 'critical' || n.stockStatus === 'low').reduce((s, n) => s + n.weeklyDemandValue, 0),
      criticalNodeCount: filteredNodes.filter(n => n.stockStatus === 'critical').length,
      lostDemandEstimate: 0, 
      absorbedDemandEstimate: 0,
    } as DemandMigrationGraph;
  }, [brain.migrationGraph, selectedCategory]);

  return (
    <div className="space-y-6 animate-slide-up flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
         <div>
            <h1 className="text-3xl font-light tracking-tight text-foreground flex items-center gap-2">
               <Network className="w-6 h-6 text-primary" />
               Catalog <span className="font-semibold">Intelligence</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Visualize how demand migrates across substitute SKUs during stockouts.</p>
         </div>
      </div>

       {/* Category Filters */}
      <div className="flex flex-wrap gap-2 shrink-0">
         <button 
           onClick={() => {setSelectedCategory("all"); setSelectedNode(null);}} 
           className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${selectedCategory === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border/30 hover:bg-secondary/50"}`}
         >
            All Categories
         </button>
         {categories.map(cat => (
             <button 
               key={cat} 
               onClick={() => {setSelectedCategory(cat); setSelectedNode(null);}} 
               className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${selectedCategory === cat ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border/30 hover:bg-secondary/50"}`}
             >
                {cat}
             </button>
         ))}
      </div>
      
      {/* Alert Strip */}
      {viewGraph.criticalNodeCount > 0 && (
         <div className="flex items-center gap-3 p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl shrink-0">
             <AlertTriangle className="w-5 h-5 text-destructive" />
             <p className="text-sm text-foreground">
                <span className="font-semibold text-destructive">{viewGraph.criticalNodeCount} SKUs</span> currently at critical stock — 
                 migration risk: <span className="font-semibold">${viewGraph.totalWeeklyDemandAtRisk.toLocaleString()}</span> weekly demand at risk in this view.
             </p>
         </div>
      )}

      {/* Main Content Area */}
      <div className="grid lg:grid-cols-4 gap-6 flex-1 min-h-0">
          <div className="lg:col-span-3 h-full rounded-2xl overflow-hidden glass shadow-sm">
             <MigrationNetworkGraph graph={viewGraph} selectedNode={selectedNode} onNodeClick={setSelectedNode} />
          </div>
          <div className="h-full">
            {selectedNode ? (
               <MigrationEdgeDetails node={selectedNode} graph={viewGraph} onSKUClick={brain.selectSKUAndNavigate} />
            ) : (
                <div className="h-full flex items-center justify-center border border-dashed border-border/40 rounded-2xl p-6 bg-card/30">
                   <p className="text-sm text-muted-foreground text-center">Select a node in the graph to view migration details and demand flow.</p>
                </div>
            )}
          </div>
      </div>
    </div>
  );
}
