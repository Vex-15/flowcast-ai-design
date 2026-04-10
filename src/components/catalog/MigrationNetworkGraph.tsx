import { useEffect, useState, useRef, useMemo } from "react";
import type { DemandMigrationGraph, MigrationNode } from "@/data/types";
import { getBrand } from "@/data/brands";

interface Props {
  graph: DemandMigrationGraph;
  selectedNode: MigrationNode | null;
  onNodeClick: (node: MigrationNode) => void;
}

export default function MigrationNetworkGraph({ graph, selectedNode, onNodeClick }: Props) {
  const [nodes, setNodes] = useState<MigrationNode[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Initialize and run simple static force layout
  useEffect(() => {
    if (!graph || graph.nodes.length === 0) return;

    // Clone nodes so we can mutate positions locally
    const simNodes = graph.nodes.map(n => ({ ...n }));

    // Re-center around width/height
    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;
    
    const maxIter = 100;
    const K = 8000; // Repulsion constant
    const springLen = 120;
    const springK = 0.03;
    const centerForce = 0.03;

    for (let iter = 0; iter < maxIter; iter++) {
      // Repulsion
      for (let i = 0; i < simNodes.length; i++) {
        for (let j = i + 1; j < simNodes.length; j++) {
          const u = simNodes[i];
          const v = simNodes[j];
          const dx = u.x - v.x;
          const dy = u.y - v.y;
          const distSq = dx*dx + dy*dy;
          if (distSq > 0 && distSq < 150000) {
            const dist = Math.sqrt(distSq);
            const force = K / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            u.vx += fx;
            u.vy += fy;
            v.vx -= fx;
            v.vy -= fy;
          }
        }
        
        // Center force
        const u = simNodes[i];
        u.vx += (cx - u.x) * centerForce;
        u.vy += (cy - u.y) * centerForce;
      }

      // Springs (Edges)
      graph.edges.forEach(edge => {
        const u = simNodes.find(n => n.skuId === edge.fromSkuId);
        const v = simNodes.find(n => n.skuId === edge.toSkuId);
        if (!u || !v) return;
        const dx = v.x - u.x;
        const dy = v.y - u.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 0) {
          const force = (dist - springLen) * springK;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          u.vx += fx;
          u.vy += fy;
          v.vx -= fx;
          v.vy -= fy;
        }
      });

      // Update positions
      simNodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        n.vx *= 0.6; // Friction
        n.vy *= 0.6;
        // Keep within bounds
        n.x = Math.max(30, Math.min(dimensions.width - 30, n.x));
        n.y = Math.max(30, Math.min(dimensions.height - 30, n.y));
      });
    }

    setNodes(simNodes);
  }, [graph, dimensions.width, dimensions.height]);

  const maxRev = useMemo(() => Math.max(...(graph?.nodes.map(n => n.revenueVelocity) || [1])), [graph]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[500px] bg-background border border-border/20 rounded-2xl relative overflow-hidden">
      <svg className="absolute inset-0 w-full h-full">
        {/* Edges */}
        <g strokeLinecap="round">
          {graph?.edges.map((edge, i) => {
            const u = nodes.find(n => n.skuId === edge.fromSkuId);
            const v = nodes.find(n => n.skuId === edge.toSkuId);
            if (!u || !v) return null;
            
            const dx = v.x - u.x;
            const dy = v.y - u.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist === 0) return null;
            const nx = -dy / dist;
            const ny = dx / dist;

            // Simple quadratic bezier curve offset
            const cx = (u.x + v.x) / 2 + nx * 50;
            const cy = (u.y + v.y) / 2 + ny * 50;

            const d = `M ${u.x} ${u.y} Q ${cx} ${cy} ${v.x} ${v.y}`;
            const isHighlighted = selectedNode?.skuId === u.skuId || selectedNode?.skuId === v.skuId;
            const isDimmed = selectedNode && !isHighlighted;
            // Base opacity off migration probability and selection state
            let opacity = Math.max(0.15, edge.probability * 0.8);
            if (isHighlighted) opacity = Math.max(0.5, edge.probability * 1.2);
            if (isDimmed) opacity = 0.05;

            const isCriticalSource = u.stockStatus === 'critical' || u.stockStatus === 'low';
            const strokeColor = isCriticalSource ? "hsl(0 72% 51%)" : "url(#edgeGradient)";
            
            return (
              <path
                key={i}
                d={d}
                fill="none"
                stroke={strokeColor}
                strokeWidth={Math.max(1, edge.probability * 8)}
                opacity={opacity}
                className={`transition-all duration-300 ${isCriticalSource ? "animate-pulse" : ""}`}
              />
            );
          })}
        </g>
        
        {/* Nodes */}
        {nodes.map(node => {
          const brand = getBrand(node.brand);
          const radius = 6 + (node.revenueVelocity / maxRev) * 14; 
          const isCritical = node.stockStatus === "critical" || node.stockStatus === "low";
          const isSelected = selectedNode?.skuId === node.skuId;
          const isDimmed = selectedNode && !isSelected && 
                           !graph.edges.some(e => (e.fromSkuId === node.skuId && e.toSkuId === selectedNode.skuId) || 
                                                  (e.toSkuId === node.skuId && e.fromSkuId === selectedNode.skuId));

          return (
            <g 
              key={node.skuId} 
              transform={`translate(${node.x},${node.y})`} 
              className="cursor-pointer" 
              onClick={() => onNodeClick(node)}
              opacity={isDimmed ? 0.3 : 1}
              style={{ transition: 'opacity 0.3s' }}
            >
              {isCritical && (
                <circle r={radius + 8} fill="none" stroke="hsl(0 72% 51%)" strokeWidth="2" className="animate-ping opacity-20" />
              )}
              {isSelected && (
                <circle r={radius + 5} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
              )}
              <circle
                r={radius}
                fill={`hsl(${brand.color})`}
                stroke={isCritical ? "hsl(0 72% 51%)" : "hsl(var(--background))"}
                strokeWidth={isCritical ? "3" : "2"}
                className="transition-all hover:brightness-110"
              />
              <text 
                y={radius + 14} 
                textAnchor="middle" 
                fill="currentColor" 
                fontSize="10" 
                className="text-foreground pointer-events-none drop-shadow-md font-medium"
                opacity={isSelected ? 1 : 0.6}
              >
                {node.skuName}
              </text>
            </g>
          );
        })}

        <defs>
          <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
