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
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

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

  // Initialize and run improved force layout with better spacing
  useEffect(() => {
    if (!graph || graph.nodes.length === 0) return;

    const simNodes = graph.nodes.map(n => ({ ...n }));

    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;
    
    // Improved force parameters for better node separation
    const maxIter = 150;
    const K = 18000;           // Much stronger repulsion to push nodes apart
    const springLen = 180;     // Longer spring rest length
    const springK = 0.02;      // Slightly softer springs
    const centerForce = 0.025; // Slightly weaker center pull
    const minNodeDist = 80;    // Minimum distance between any two nodes
    const padding = 50;        // Keep nodes away from edges

    // Initialize positions in a circle for better starting layout
    const angleStep = (2 * Math.PI) / simNodes.length;
    const initRadius = Math.min(dimensions.width, dimensions.height) * 0.3;
    simNodes.forEach((n, i) => {
      n.x = cx + Math.cos(angleStep * i) * initRadius;
      n.y = cy + Math.sin(angleStep * i) * initRadius;
      n.vx = 0;
      n.vy = 0;
    });

    for (let iter = 0; iter < maxIter; iter++) {
      const alpha = 1 - iter / maxIter; // cooling factor

      // Repulsion between all nodes
      for (let i = 0; i < simNodes.length; i++) {
        for (let j = i + 1; j < simNodes.length; j++) {
          const u = simNodes[i];
          const v = simNodes[j];
          let dx = u.x - v.x;
          let dy = u.y - v.y;
          let distSq = dx * dx + dy * dy;
          
          // Prevent zero distance
          if (distSq < 1) {
            dx = (Math.random() - 0.5) * 2;
            dy = (Math.random() - 0.5) * 2;
            distSq = dx * dx + dy * dy;
          }
          
          const dist = Math.sqrt(distSq);
          
          // Strong repulsion at close range
          if (dist < 400) {
            const force = (K / distSq) * alpha;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            u.vx += fx;
            u.vy += fy;
            v.vx -= fx;
            v.vy -= fy;
          }

          // Hard minimum distance enforcement
          if (dist < minNodeDist) {
            const pushForce = (minNodeDist - dist) * 0.5;
            const pfx = (dx / dist) * pushForce;
            const pfy = (dy / dist) * pushForce;
            u.vx += pfx;
            u.vy += pfy;
            v.vx -= pfx;
            v.vy -= pfy;
          }
        }
        
        // Center force
        const u = simNodes[i];
        u.vx += (cx - u.x) * centerForce * alpha;
        u.vy += (cy - u.y) * centerForce * alpha;
      }

      // Springs (Edges)
      graph.edges.forEach(edge => {
        const u = simNodes.find(n => n.skuId === edge.fromSkuId);
        const v = simNodes.find(n => n.skuId === edge.toSkuId);
        if (!u || !v) return;
        const dx = v.x - u.x;
        const dy = v.y - u.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          const force = (dist - springLen) * springK * alpha;
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
        n.vx *= 0.55; // Friction
        n.vy *= 0.55;
        // Keep within bounds with padding
        n.x = Math.max(padding, Math.min(dimensions.width - padding, n.x));
        n.y = Math.max(padding, Math.min(dimensions.height - padding, n.y));
      });
    }

    setNodes(simNodes);
  }, [graph, dimensions.width, dimensions.height]);

  const maxRev = useMemo(() => Math.max(...(graph?.nodes.map(n => n.revenueVelocity) || [1])), [graph]);

  // Determine which nodes are connected to the selected or hovered node
  const activeNodeId = hoveredNode || selectedNode?.skuId || null;
  const connectedNodeIds = useMemo(() => {
    if (!activeNodeId) return new Set<string>();
    const ids = new Set<string>();
    ids.add(activeNodeId);
    graph.edges.forEach(e => {
      if (e.fromSkuId === activeNodeId) ids.add(e.toSkuId);
      if (e.toSkuId === activeNodeId) ids.add(e.fromSkuId);
    });
    return ids;
  }, [activeNodeId, graph.edges]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[500px] bg-background/80 border border-border/15 rounded-2xl relative overflow-hidden">
      {/* Subtle grid background */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--muted-foreground)) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />
      
      <svg className="absolute inset-0 w-full h-full">
        {/* Edges */}
        <g strokeLinecap="round">
          {graph?.edges.map((edge, i) => {
            const u = nodes.find(n => n.skuId === edge.fromSkuId);
            const v = nodes.find(n => n.skuId === edge.toSkuId);
            if (!u || !v) return null;
            
            const dx = v.x - u.x;
            const dy = v.y - u.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist === 0) return null;
            const nx = -dy / dist;
            const ny = dx / dist;

            // Smaller curve offset for cleaner paths
            const ctrlX = (u.x + v.x) / 2 + nx * 30;
            const ctrlY = (u.y + v.y) / 2 + ny * 30;

            const d = `M ${u.x} ${u.y} Q ${ctrlX} ${ctrlY} ${v.x} ${v.y}`;
            const isHighlighted = activeNodeId === u.skuId || activeNodeId === v.skuId;
            const isDimmed = activeNodeId && !isHighlighted;
            
            let opacity = Math.max(0.12, edge.probability * 0.6);
            if (isHighlighted) opacity = Math.max(0.5, edge.probability * 1.2);
            if (isDimmed) opacity = 0.04;

            const isCriticalSource = u.stockStatus === 'critical' || u.stockStatus === 'low';
            const strokeColor = isCriticalSource ? "hsl(0 72% 51%)" : "url(#edgeGradient)";
            
            return (
              <path
                key={i}
                d={d}
                fill="none"
                stroke={strokeColor}
                strokeWidth={Math.max(1, edge.probability * 6)}
                opacity={opacity}
                className="transition-all duration-300"
                strokeDasharray={isCriticalSource ? "6 3" : "none"}
              />
            );
          })}
        </g>
        
        {/* Nodes — rendered in two passes: non-selected first, then selected on top */}
        {nodes
          .sort((a, b) => {
            // Selected/hovered node renders last (on top)
            if (a.skuId === activeNodeId) return 1;
            if (b.skuId === activeNodeId) return -1;
            return 0;
          })
          .map(node => {
          const brand = getBrand(node.brand);
          const radius = 8 + (node.revenueVelocity / maxRev) * 16; 
          const isCritical = node.stockStatus === "critical" || node.stockStatus === "low";
          const isSelected = selectedNode?.skuId === node.skuId;
          const isHovered = hoveredNode === node.skuId;
          const isActive = isSelected || isHovered;
          const isDimmed = activeNodeId && !connectedNodeIds.has(node.skuId);

          // Only show label if: node is active, connected to active, or no active node at all
          const showLabel = !activeNodeId || connectedNodeIds.has(node.skuId);

          return (
            <g 
              key={node.skuId} 
              transform={`translate(${node.x},${node.y})`} 
              className="cursor-pointer" 
              onClick={() => onNodeClick(node)}
              onMouseEnter={() => setHoveredNode(node.skuId)}
              onMouseLeave={() => setHoveredNode(null)}
              opacity={isDimmed ? 0.15 : 1}
              style={{ transition: 'opacity 0.3s, transform 0.3s' }}
            >
              {/* Critical pulse ring */}
              {isCritical && (
                <circle r={radius + 10} fill="none" stroke="hsl(0 72% 51%)" strokeWidth="1.5" className="animate-ping opacity-15" />
              )}
              {/* Selection ring */}
              {isActive && (
                <circle 
                  r={radius + 6} 
                  fill="none" 
                  stroke={`hsl(${isSelected ? 'var(--primary)' : brand.color})`} 
                  strokeWidth="2" 
                  opacity="0.6"
                  strokeDasharray="4 2"
                />
              )}
              {/* Glow behind node */}
              {isActive && (
                <circle 
                  r={radius + 3} 
                  fill={`hsl(${brand.color} / 0.15)`} 
                />
              )}
              {/* Main node circle */}
              <circle
                r={radius}
                fill={`hsl(${brand.color})`}
                stroke={isCritical ? "hsl(0 72% 51%)" : "hsl(var(--background))"}
                strokeWidth={isCritical ? "2.5" : "2"}
                className="transition-all duration-200"
                style={{ filter: isActive ? `drop-shadow(0 0 8px hsl(${brand.color} / 0.5))` : 'none' }}
              />
              {/* Label — only shown contextually for readability */}
              {showLabel && (
                <g>
                  {/* Label background pill for readability */}
                  <rect 
                    x={-(node.skuName.length * 2.8 + 8)} 
                    y={radius + 6} 
                    width={node.skuName.length * 5.6 + 16} 
                    height={18} 
                    rx={9} 
                    fill="hsl(var(--background) / 0.85)" 
                    stroke="hsl(var(--border) / 0.2)"
                    strokeWidth="0.5"
                    opacity={isActive ? 1 : 0.7}
                  />
                  <text 
                    y={radius + 19} 
                    textAnchor="middle" 
                    fill="currentColor" 
                    fontSize="10" 
                    className="text-foreground pointer-events-none font-medium"
                    opacity={isActive ? 1 : 0.7}
                  >
                    {node.skuName.length > 22 ? node.skuName.slice(0, 20) + "…" : node.skuName}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        <defs>
          <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.2" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
          </linearGradient>
        </defs>
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 px-3 py-2 rounded-xl glass-strong text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-destructive/80 border border-destructive" />
          Critical / Low Stock
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600/50" />
          Healthy Stock
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-6 border-t-2 border-dashed border-destructive/50" />
          At-Risk Path
        </div>
      </div>
    </div>
  );
}
