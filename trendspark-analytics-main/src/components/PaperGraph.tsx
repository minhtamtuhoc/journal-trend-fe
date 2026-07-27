import { useState, useRef, useEffect, MouseEvent, WheelEvent, TouchEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ZoomIn, ZoomOut, Maximize2, ExternalLink, HelpCircle, ArrowUpRight, FileText, Info, X } from "lucide-react";
import type { GraphPaperNode } from "@/services/interfaces/papers.service";

export interface CombinedGraphNode extends GraphPaperNode {
  relationType: "reference" | "citation";
  displayIndex?: number;
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
  const [showLegend, setShowLegend] = useState<boolean>(false);

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
      <div className="h-[480px] w-full rounded-2xl border border-border bg-secondary/5 flex flex-col items-center justify-center text-sm text-muted-foreground animate-pulse">
        <div className="size-8 rounded-full border-2 border-brand border-t-transparent animate-spin mb-4" />
        Loading citation network graph...
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

  // Distribute nodes such that EVERY SINGLE NODE GETS A 100% EXCLUSIVE, DEDICATED ANGULAR RAY
  // No two nodes share a line, and no lines overlap each other!
  const positionNodesInSector = (
    subNodes: CombinedGraphNode[],
    minAngle: number,
    maxAngle: number,
    startIndex: number
  ) => {
    const totalCount = subNodes.length;
    if (totalCount === 0) return [];

    const angleSpan = maxAngle - minAngle;
    const angleStep = totalCount > 1 ? angleSpan / (totalCount - 1) : 0;

    return subNodes.map((node, i) => {
      const angle = totalCount === 1
        ? minAngle + angleSpan / 2
        : minAngle + i * angleStep;

      // Radius alternates smoothly across 3 concentric tiers (150px, 235px, 320px)
      // Every node gets its OWN unique angle so lines never collide or share a ray!
      const ringTier = i % 3;
      const ringRadius = 150 + ringTier * 85;

      const x = ringRadius * Math.cos(angle);
      const y = ringRadius * Math.sin(angle);

      return {
        ...node,
        x,
        y,
        index: startIndex + i,
      };
    });
  };

  const refNodes = nodes.filter((n) => n.relationType === "reference");
  const citeNodes = nodes.filter((n) => n.relationType === "citation");

  const positionedRefNodes = positionNodesInSector(
    refNodes,
    Math.PI / 2 + 0.1,
    (3 * Math.PI) / 2 - 0.1,
    0
  );

  const positionedCiteNodes = positionNodesInSector(
    citeNodes,
    -Math.PI / 2 + 0.1,
    Math.PI / 2 - 0.1,
    refNodes.length
  );

  const positionedNodes = [...positionedRefNodes, ...positionedCiteNodes];

  // Pan handlers
  const handleMouseDown = (e: MouseEvent<SVGSVGElement>) => {
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
      
      {/* Top Header Bar: Legend Toggle & Quick Counters */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <button
          onClick={() => setShowLegend(!showLegend)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur transition-all cursor-pointer shadow-lg ${
            showLegend
              ? "bg-brand text-brand-foreground border-brand shadow-brand/20"
              : "bg-popover/80 border-border text-muted-foreground hover:text-foreground hover:bg-secondary/80"
          }`}
        >
          <Info className="size-3.5" />
          <span>Legend</span>
        </button>

        <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-popover/80 border border-border backdrop-blur text-[11px] font-mono text-muted-foreground shadow-sm">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>References: <strong className="text-foreground font-bold">{refNodes.length}</strong></span>
          </span>
          <span className="text-border/60">|</span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-rose-500" />
            <span>Citations: <strong className="text-foreground font-bold">{citeNodes.length}</strong></span>
          </span>
        </div>
      </div>

      {/* Floating Sector Guide Badges at Outer Bottom Corners (HTML Overlay so node circles can NEVER overlap them!) */}
      <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none flex justify-between items-center select-none">
        {refNodes.length > 0 ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-popover/90 border border-emerald-500/30 text-emerald-400 backdrop-blur-md shadow-xl text-xs font-mono font-bold uppercase tracking-wider">
            ← References ({refNodes.length})
          </div>
        ) : <div />}

        {citeNodes.length > 0 ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-popover/90 border border-rose-500/30 text-rose-400 backdrop-blur-md shadow-xl text-xs font-mono font-bold uppercase tracking-wider">
            Citations ({citeNodes.length}) →
          </div>
        ) : <div />}
      </div>

      {/* Toggleable Legend Overlay Box */}
      {showLegend && (
        <div className="absolute top-14 left-4 z-20 w-72 p-3.5 rounded-2xl bg-popover/95 border border-border/80 backdrop-blur-md shadow-2xl space-y-2 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <Info className="size-4 text-brand" />
              <span>Diagram Legend & Guide</span>
            </div>
            <button
              onClick={() => setShowLegend(false)}
              className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-[11px] font-medium text-muted-foreground pt-1">
            {/* Center Node */}
            <div className="flex items-center gap-2.5">
              <span className="size-3 rounded-full border-2 border-brand bg-brand/30 shadow-[0_0_10px_var(--brand)] shrink-0" />
              <div>
                <span className="text-foreground font-semibold block">Center Node (Current)</span>
                <span className="text-[10px] text-muted-foreground">Article currently being viewed</span>
              </div>
            </div>

            {/* Left side: References */}
            <div className="flex items-center gap-2.5">
              <span className="size-3 rounded-full border-2 border-emerald-500 bg-emerald-500/20 shrink-0" />
              <div>
                <span className="text-foreground font-semibold block">Left Side: References ({refNodes.length})</span>
                <span className="text-[10px] text-muted-foreground">Articles cited by this paper</span>
              </div>
            </div>

            {/* Right side: Citations */}
            <div className="flex items-center gap-2.5">
              <span className="size-3 rounded-full border-2 border-rose-500 bg-rose-500/20 shrink-0" />
              <div>
                <span className="text-foreground font-semibold block">Right Side: Citations ({citeNodes.length})</span>
                <span className="text-[10px] text-muted-foreground">Articles citing this paper</span>
              </div>
            </div>

            <div className="border-t border-border/50 pt-2 space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="w-4 h-0.5 bg-foreground rounded-full shrink-0" />
                <span><strong className="text-foreground">Solid line</strong>: In-system paper (View details)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-4 h-0.5 border-b-2 border-dashed border-muted-foreground/60 shrink-0" />
                <span><strong className="text-foreground">Dashed line</strong>: External paper (Metadata only)</span>
              </div>
            </div>

            <div className="text-[10px] text-muted-foreground/70 border-t border-border/50 pt-2 leading-relaxed">
              💡 <strong>Tips</strong>: Scroll wheel to zoom · Drag canvas to pan · Hover/Click node for details.
            </div>
          </div>
        </div>
      )}

      {/* Zoom Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 p-1 rounded-xl bg-popover/80 border border-border backdrop-blur shadow-sm">
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

      {/* SVG Canvas Area */}
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
          
          {/* Background Gradients Definition */}
          <defs>
            <linearGradient id="line-ref-local-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.9} />
              <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="line-ref-external-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.2} />
            </linearGradient>
            <linearGradient id="line-cite-local-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.45} />
            </linearGradient>
            <linearGradient id="line-cite-external-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.25} />
            </linearGradient>
          </defs>

          {/* Background Concentric Orbit Rings */}
          {[150, 235, 320].map((radius) => (
            <circle
              key={`orbit-${radius}`}
              r={radius}
              fill="none"
              stroke="var(--border)"
              strokeWidth={1}
              strokeDasharray="4 6"
              className="opacity-30 pointer-events-none"
            />
          ))}

          {/* LAYER 1: Connection Lines (Rendered underneath central & outer node circles so central & outer node circles render ON TOP of lines) */}
          <g className="pointer-events-none">
            {positionedNodes.map((node) => {
              const isRef = node.relationType === "reference";
              const isLocal = node.existsLocally;
              const isHovered = hoveredNode?.openAlexId === node.openAlexId;
              const isSelected = selectedNode?.openAlexId === node.openAlexId;

              const strokeVal = isRef
                ? (isLocal ? "url(#line-ref-local-gradient)" : "url(#line-ref-external-gradient)")
                : (isLocal ? "url(#line-cite-local-gradient)" : "url(#line-cite-external-gradient)");

              return (
                <line
                  key={`line-${node.openAlexId}-${node.relationType}`}
                  x1={0}
                  y1={0}
                  x2={node.x}
                  y2={node.y}
                  stroke={strokeVal}
                  strokeWidth={isHovered || isSelected ? 3.5 : (isLocal ? 2 : 1.4)}
                  strokeDasharray={isLocal ? "0" : "3 3"}
                  className={`transition-all duration-200 ${
                    hoveredNode
                      ? (isHovered ? "opacity-100" : "opacity-25")
                      : "opacity-85"
                  }`}
                />
              );
            })}
          </g>

          {/* LAYER 2: Central Current Paper Node (Rendered ON TOP of connection lines) */}
          <g className="cursor-pointer">
            {/* Outer Glowing Pulsing Rings */}
            <circle
              r={40}
              fill="none"
              stroke="var(--brand)"
              strokeWidth={1.5}
              className="animate-ping opacity-25"
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

          {/* LAYER 3: Outer Nodes (Rendered ON TOP of connection lines so node background circles cleanly cover line endpoints without overlaps) */}
          {positionedNodes.map((node) => {
            const isSelected = selectedNode?.openAlexId === node.openAlexId;
            const isHovered = hoveredNode?.openAlexId === node.openAlexId;
            const labelNumber = node.displayIndex ?? (node.index + 1);

            return (
              <g
                key={`node-${node.openAlexId}-${node.relationType}`}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(isSelected ? null : node);
                }}
                onMouseEnter={(e) => handleNodeHover(e, node)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer group"
              >
                {/* Highlight ring for selected or hovered node */}
                {(isSelected || isHovered) && (
                  <circle
                    r={24}
                    fill="none"
                    stroke={
                      node.relationType === "reference" ? "var(--chart-2)" : "#f43f5e"
                    }
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
                      ? (node.relationType === "reference" ? "var(--chart-2)" : "#f43f5e")
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
                      ? (node.relationType === "reference" ? "var(--chart-2)" : "#f43f5e")
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
                  {labelNumber}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredNode && !selectedNode && (
        <div
          className="absolute z-30 pointer-events-none p-3 max-w-[280px] rounded-xl bg-popover/95 border border-border/80 backdrop-blur-md shadow-2xl animate-fade-in"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
              hoveredNode.relationType === "reference" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
            }`}>
              {hoveredNode.relationType === "reference" ? "Reference" : "Citation"} #{hoveredNode.displayIndex ?? (hoveredNode.index + 1)}
            </span>
          </div>
          <p className="text-xs font-bold text-foreground line-clamp-2 leading-tight mb-1.5">{hoveredNode.title}</p>
          <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] font-mono text-muted-foreground">
            <span>Year: <strong className="text-foreground">{hoveredNode.year}</strong></span>
            <span>•</span>
            <span>Citations: <strong className="text-brand font-bold">{hoveredNode.citations?.toLocaleString() ?? "N/A"}</strong></span>
          </div>
          {hoveredNode.existsLocally && (
            <div className="mt-2 text-[9px] text-brand font-bold flex items-center gap-0.5 border-t border-border/50 pt-1">
              <ArrowUpRight className="size-3" /> Click to view details
            </div>
          )}
        </div>
      )}

      {/* Selected Node Panel (Bottom Slide-in) */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 left-4 z-20 p-4 rounded-2xl bg-popover/95 border border-brand/30 backdrop-blur-md shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-up">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                selectedNode.relationType === "reference"
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-rose-500/10 text-rose-500"
              }`}>
                {selectedNode.relationType === "reference" ? "Referenced Paper (Reference)" : "Citing Paper (Citation)"} #{selectedNode.displayIndex ?? (selectedNode.index + 1)}
              </span>
              {selectedNode.existsLocally ? (
                <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">In-system paper</span>
              ) : (
                <span className="text-[9px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">External metadata</span>
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
                search={{ tab: "overview" }}
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
