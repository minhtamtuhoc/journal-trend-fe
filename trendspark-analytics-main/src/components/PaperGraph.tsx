import { useState, useRef, useEffect, MouseEvent, WheelEvent, TouchEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ZoomIn, ZoomOut, Maximize2, ExternalLink, HelpCircle, ArrowUpRight, FileText } from "lucide-react";
import type { GraphPaperNode } from "@/services/interfaces/papers.service";

export interface CombinedGraphNode extends GraphPaperNode {
  relationType: "reference" | "citation";
}

interface PaperGraphProps {
  currentPaperTitle: string;
  nodes: CombinedGraphNode[];
  isLoading: boolean;
}

export function PaperGraph({ currentPaperTitle, nodes, isLoading }: PaperGraphProps) {
  const [zoom, setZoom] = useState<number>(0.8);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<CombinedGraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<CombinedGraphNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Reset pan/zoom on node data change
  useEffect(() => {
    setZoom(0.8);
    setPanX(0);
    setPanY(0);
    setHoveredNode(null);
    setSelectedNode(null);
  }, [nodes]);

  if (isLoading) {
    return (
      <div className="h-[450px] w-full rounded-2xl border border-border bg-secondary/5 flex flex-col items-center justify-center text-sm text-muted-foreground animate-pulse">
        <div className="size-8 rounded-full border-2 border-brand border-t-transparent animate-spin mb-4" />
        Loading paper relationship diagram...
      </div>
    );
  }

  if (!nodes || nodes.length === 0) {
    return (
      <div className="h-[400px] w-full rounded-2xl border border-border bg-secondary/5 flex flex-col items-center justify-center p-6 text-center text-sm text-muted-foreground">
        <HelpCircle className="size-8 text-muted-foreground/50 mb-3" />
        <p className="font-semibold text-foreground mb-1">No citation network data found</p>
        <p className="text-xs text-muted-foreground max-w-sm">
          No referenced or citing papers found for this article on OpenAlex.
        </p>
      </div>
    );
  }

  // Distribute nodes in concentric rings within their respective sectors:
  // References on the left, Citations on the right
  const positionNodesInSector = (
    subNodes: CombinedGraphNode[],
    minAngle: number,
    maxAngle: number,
    startIndex: number
  ) => {
    return subNodes.map((node, index) => {
      let ringIndex = 0;
      let nodeInRingIndex = index;
      let currentRingCapacity = 4;
      let totalCapacitySoFar = 0;

      while (nodeInRingIndex >= currentRingCapacity) {
        nodeInRingIndex -= currentRingCapacity;
        totalCapacitySoFar += currentRingCapacity;
        ringIndex++;
        currentRingCapacity = 4 + ringIndex * 4;
      }

      const ringRadius = 130 + ringIndex * 90;
      const totalNodesInThisRing = Math.min(
        currentRingCapacity,
        subNodes.length - totalCapacitySoFar
      );

      const stagger = (ringIndex % 2) * (0.15 * Math.PI / currentRingCapacity);
      
      let angle = minAngle + (maxAngle - minAngle) / 2;
      if (totalNodesInThisRing > 1) {
        const angleStep = (maxAngle - minAngle) / (totalNodesInThisRing - 1);
        angle = minAngle + nodeInRingIndex * angleStep + stagger;
      } else {
        angle = angle + stagger;
      }

      const x = ringRadius * Math.cos(angle);
      const y = ringRadius * Math.sin(angle);

      return {
        ...node,
        x,
        y,
        index: startIndex + index,
      };
    });
  };

  const refNodes = nodes.filter((n) => n.relationType === "reference");
  const citeNodes = nodes.filter((n) => n.relationType === "citation");

  const positionedRefNodes = positionNodesInSector(
    refNodes,
    Math.PI / 2 + 0.15,
    (3 * Math.PI) / 2 - 0.15,
    0
  );

  const positionedCiteNodes = positionNodesInSector(
    citeNodes,
    -Math.PI / 2 + 0.15,
    Math.PI / 2 - 0.15,
    refNodes.length
  );

  const positionedNodes = [...positionedRefNodes, ...positionedCiteNodes];

  // Pan handlers
  const handleMouseDown = (e: MouseEvent<SVGSVGElement>) => {
    // Only drag with left click
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoveredNode(null);
  };

  // Touch pan handlers
  const handleTouchStart = (e: TouchEvent<SVGSVGElement>) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - panX, y: touch.clientY - panY });
  };

  const handleTouchMove = (e: TouchEvent<SVGSVGElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPanX(touch.clientX - dragStart.x);
    setPanY(touch.clientY - dragStart.y);
  };

  // Zoom handlers
  const handleWheel = (e: WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const nextZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
    // Limit zoom between 0.15x and 3x
    setZoom(Math.max(0.15, Math.min(3, nextZoom)));
  };

  const zoomIn = () => setZoom(z => Math.min(3, z * 1.2));
  const zoomOut = () => setZoom(z => Math.max(0.15, z / 1.2));
  const resetZoom = () => {
    setZoom(0.8);
    setPanX(0);
    setPanY(0);
    setSelectedNode(null);
    setHoveredNode(null);
  };

  // Node hover handler
  const handleNodeHover = (e: MouseEvent<SVGGElement>, node: CombinedGraphNode) => {
    if (isDragging) return;
    setHoveredNode(node);
    
    // Position tooltip relative to container
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left + 15,
        y: e.clientY - rect.top + 15,
      });
    }
  };

  return (
    <div className="relative flex flex-col w-full h-[520px] rounded-2xl border border-border bg-secondary/5 overflow-hidden glass select-none" ref={containerRef}>
      
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 p-1 rounded-xl bg-popover/80 border border-border backdrop-blur">
        <button onClick={zoomIn} title="Zoom In" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer">
          <ZoomIn className="size-4" />
        </button>
        <button onClick={zoomOut} title="Zoom Out" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer">
          <ZoomOut className="size-4" />
        </button>
        <button onClick={resetZoom} title="Reset View" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer">
          <Maximize2 className="size-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 p-3 rounded-xl bg-popover/80 border border-border backdrop-blur text-[10px] space-y-1.5 font-medium text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full border-2 border-brand bg-brand/20 shadow-[0_0_8px_var(--brand)]" />
          <span className="text-foreground font-semibold">Current paper</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full border border-chart-2 bg-chart-2/20" />
          <span>Left side: Referenced papers (References)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full border border-chart-5 bg-chart-5/20" />
          <span>Right side: Citing papers (Citations)</span>
        </div>
        <div className="flex items-center gap-2 border-t border-border/50 pt-1 mt-1">
          <span className="size-2 rounded-full bg-foreground" />
          <span>Solid line: Available in system (View details)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-muted-foreground/40" />
          <span>Dashed line: Outside system (Metadata only)</span>
        </div>
        <div className="text-[9px] text-muted-foreground/60 border-t border-border/50 pt-1 mt-1">
          * Scroll to zoom · Click and drag to pan diagram
        </div>
      </div>

      {/* Graph Area */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        onWheel={handleWheel}
      >
        <g transform={`translate(${400 + panX}, ${250 + panY}) scale(${zoom})`}>
          {/* Connection Lines */}
          {positionedNodes.map((node) => {
            const isRef = node.relationType === "reference";
            const isLocal = node.existsLocally;
            const strokeVal = isRef
              ? (isLocal ? "url(#line-ref-local-gradient)" : "url(#line-ref-external-gradient)")
              : (isLocal ? "url(#line-cite-local-gradient)" : "url(#line-cite-external-gradient)");
            return (
              <line
                key={`line-${node.openAlexId}`}
                x1={0}
                y1={0}
                x2={node.x}
                y2={node.y}
                stroke={strokeVal}
                strokeWidth={isLocal ? 1.8 : 1.2}
                strokeDasharray={isLocal ? "0" : "3 3"}
                className="opacity-70"
              />
            );
          })}

          {/* Background Gradients Definition */}
          <defs>
            <linearGradient id="line-ref-local-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.9} />
              <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.3} />
            </linearGradient>
            <linearGradient id="line-ref-external-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="line-cite-local-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--chart-5)" stopOpacity={0.9} />
              <stop offset="100%" stopColor="var(--chart-5)" stopOpacity={0.3} />
            </linearGradient>
            <linearGradient id="line-cite-external-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--chart-5)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--chart-5)" stopOpacity={0.1} />
            </linearGradient>
          </defs>

          {/* Central Current Paper Node */}
          <g className="cursor-pointer">
            {/* Glowing Ring */}
            <circle
              r={36}
              fill="none"
              stroke="var(--brand)"
              strokeWidth={1.5}
              className="animate-ping opacity-35"
              style={{ animationDuration: '3s' }}
            />
            {/* Inner Ring */}
            <circle
              r={28}
              fill="var(--surface)"
              stroke="var(--brand)"
              strokeWidth={3}
              className="shadow-2xl"
            />
            <circle
              r={20}
              fill="var(--brand)"
              className="opacity-20"
            />
            <text
              textAnchor="middle"
              y={4}
              fill="var(--brand)"
              fontSize={10}
              fontWeight="bold"
              className="pointer-events-none select-none font-mono"
            >
              CURRENT
            </text>
          </g>

          {/* Outer Nodes */}
          {positionedNodes.map((node) => {
            const isSelected = selectedNode?.openAlexId === node.openAlexId;
            return (
              <g
                key={`node-${node.openAlexId}`}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(isSelected ? null : node);
                }}
                onMouseEnter={(e) => handleNodeHover(e, node)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer group"
              >
                {/* Highlight ring for selected node */}
                {isSelected && (
                  <circle
                    r={24}
                    fill="none"
                    stroke="var(--brand)"
                    strokeWidth={2}
                    className="animate-pulse"
                  />
                )}
                {/* Node Outer Ring */}
                <circle
                  r={16}
                  fill="var(--surface)"
                  stroke={
                    node.existsLocally
                      ? (node.relationType === "reference" ? "var(--chart-2)" : "var(--chart-5)")
                      : "var(--border)"
                  }
                  strokeWidth={node.existsLocally ? 2.5 : 1.5}
                  className="transition-all duration-300 group-hover:scale-115"
                />
                {/* Node Center Fill */}
                <circle
                  r={9}
                  fill={
                    node.existsLocally
                      ? (node.relationType === "reference" ? "var(--chart-2)" : "var(--chart-5)")
                      : "var(--muted)"
                  }
                  className="opacity-70 group-hover:opacity-100 transition-opacity"
                />
                {/* Node Label (Number index) */}
                <text
                  textAnchor="middle"
                  y={3}
                  fill={
                    node.existsLocally
                      ? "var(--background)"
                      : "var(--muted-foreground)"
                  }
                  fontSize={8}
                  fontWeight="bold"
                  className="pointer-events-none select-none font-mono group-hover:fill-foreground"
                >
                  {node.index + 1}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredNode && !selectedNode && (
        <div
          className="absolute z-20 pointer-events-none p-3 max-w-[280px] rounded-xl bg-popover/95 border border-border/80 backdrop-blur shadow-2xl animate-fade-in"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          <p className="text-xs font-bold text-foreground line-clamp-2 leading-tight mb-1.5">{hoveredNode.title}</p>
          <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] font-mono text-muted-foreground">
            <span>Year: <strong className="text-foreground">{hoveredNode.year}</strong></span>
            <span>•</span>
            <span>Citations: <strong className="text-brand font-bold">{hoveredNode.citations?.toLocaleString() ?? "N/A"}</strong></span>
          </div>
          {hoveredNode.existsLocally && (
            <div className="mt-2 text-[9px] text-brand font-bold flex items-center gap-0.5">
              <ArrowUpRight className="size-3" /> Click to view this paper
            </div>
          )}
        </div>
      )}

      {/* Selected Node Panel (Bottom Slide-in) */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 left-4 z-10 p-4 rounded-xl bg-popover/95 border border-brand/30 backdrop-blur shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-up">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                selectedNode.relationType === "reference"
                  ? "bg-chart-2/10 text-chart-2"
                  : "bg-chart-5/10 text-chart-5"
              }`}>
                {selectedNode.relationType === "reference" ? "Referenced Paper (Reference)" : "Citing Paper (Citation)"}
              </span>
              {selectedNode.existsLocally ? (
                <span className="text-[9px] font-mono bg-success/10 text-success px-1.5 py-0.5 rounded border border-success/20">Available in system</span>
              ) : (
                <span className="text-[9px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Outside system</span>
              )}
            </div>
            <h4 className="text-sm font-bold text-foreground line-clamp-1 leading-snug">{selectedNode.title}</h4>
            <p className="text-[10px] text-muted-foreground font-mono mt-1">
              Year: <span className="text-foreground font-bold">{selectedNode.year}</span> · Citations: <span className="text-brand font-bold">{selectedNode.citations?.toLocaleString() ?? "N/A"}</span> {selectedNode.doi && `· DOI: ${selectedNode.doi}`}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            {selectedNode.existsLocally && selectedNode.localPaperId ? (
              <Link
                to="/papers/$id"
                params={{ id: selectedNode.localPaperId }}
                onClick={() => setSelectedNode(null)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-brand-foreground glow-brand transition-transform hover:scale-[1.02]"
                style={{ background: "var(--gradient-brand)" }}
              >
                <FileText className="size-3.5" /> View Details
              </Link>
            ) : null}

            {selectedNode.doi ? (
              <a
                href={`https://doi.org/${selectedNode.doi}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-semibold border border-border bg-secondary/20 hover:bg-secondary/40 text-foreground transition-colors"
              >
                DOI Link <ExternalLink className="size-3" />
              </a>
            ) : null}

            <a
              href={`https://openalex.org/${selectedNode.openAlexId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-semibold border border-border hover:bg-secondary/20 text-muted-foreground transition-colors"
            >
              OpenAlex <ExternalLink className="size-3" />
            </a>

            <button
              onClick={() => setSelectedNode(null)}
              className="h-8 px-3 rounded-lg text-xs font-medium border border-transparent hover:bg-secondary text-muted-foreground transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
