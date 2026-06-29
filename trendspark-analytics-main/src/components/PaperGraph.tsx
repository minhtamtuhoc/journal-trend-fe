import { useState, useRef, useEffect, MouseEvent, WheelEvent, TouchEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ZoomIn, ZoomOut, Maximize2, ExternalLink, HelpCircle, ArrowUpRight, FileText } from "lucide-react";
import type { GraphPaperNode } from "@/services/interfaces/papers.service";

interface PaperGraphProps {
  currentPaperTitle: string;
  nodes: GraphPaperNode[];
  isLoading: boolean;
  graphType: "references" | "citations";
}

export function PaperGraph({ currentPaperTitle, nodes, isLoading, graphType }: PaperGraphProps) {
  const [zoom, setZoom] = useState<number>(0.8);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<GraphPaperNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphPaperNode | null>(null);
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
        Đang tải sơ đồ mối quan hệ bài viết...
      </div>
    );
  }

  if (!nodes || nodes.length === 0) {
    return (
      <div className="h-[400px] w-full rounded-2xl border border-border bg-secondary/5 flex flex-col items-center justify-center p-6 text-center text-sm text-muted-foreground">
        <HelpCircle className="size-8 text-muted-foreground/50 mb-3" />
        <p className="font-semibold text-foreground mb-1">Không tìm thấy dữ liệu liên kết</p>
        <p className="text-xs text-muted-foreground max-w-sm">
          {graphType === "references"
            ? "Bài báo này chưa đồng bộ danh sách bài tham chiếu hoặc OpenAlex chưa cập nhật."
            : "Chưa tìm thấy bài viết nào trích dẫn bài báo này trên OpenAlex."}
        </p>
      </div>
    );
  }

  // Calculate node positions deterministically
  const positionedNodes = nodes.map((node, index) => {
    let ringIndex = 0;
    let nodeInRingIndex = index;
    let currentRingCapacity = 8;
    let totalCapacitySoFar = 0;

    // Distribute nodes in concentric rings: Ring 0 (cap 8), Ring 1 (cap 16), Ring 2 (cap 24)...
    while (nodeInRingIndex >= currentRingCapacity) {
      nodeInRingIndex -= currentRingCapacity;
      totalCapacitySoFar += currentRingCapacity;
      ringIndex++;
      currentRingCapacity = 8 + ringIndex * 8;
    }

    const ringRadius = 140 + ringIndex * 100;
    const totalNodesInThisRing = Math.min(
      currentRingCapacity,
      nodes.length - totalCapacitySoFar
    );
    
    // Add offset for alternate rings to look staggered
    const angleOffset = (ringIndex % 2) * (Math.PI / currentRingCapacity);
    const angle = (nodeInRingIndex / totalNodesInThisRing) * 2 * Math.PI + angleOffset;

    const x = ringRadius * Math.cos(angle);
    const y = ringRadius * Math.sin(angle);

    return {
      ...node,
      x,
      y,
      index,
    };
  });

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
  const handleNodeHover = (e: MouseEvent<SVGGElement>, node: GraphPaperNode) => {
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
          <span className="text-foreground font-semibold">Bài viết hiện tại</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full border border-brand bg-brand/10" />
          <span>Bài viết có sẵn trong hệ thống (Xem chi tiết được)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full border border-muted-foreground/30 bg-muted/20" />
          <span>Bài viết ngoài hệ thống (Chỉ xem metadata)</span>
        </div>
        <div className="text-[9px] text-muted-foreground/60 border-t border-border/50 pt-1.5 mt-1.5">
          * Lăn chuột để zoom · Nhấp kéo để di chuyển sơ đồ
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
          {positionedNodes.map((node) => (
            <line
              key={`line-${node.openAlexId}`}
              x1={0}
              y1={0}
              x2={node.x}
              y2={node.y}
              stroke={node.existsLocally ? "url(#line-brand-gradient)" : "url(#line-muted-gradient)"}
              strokeWidth={node.existsLocally ? 1.5 : 1}
              strokeDasharray={node.existsLocally ? "0" : "4 4"}
              className="opacity-60"
            />
          ))}

          {/* Background Gradients Definition */}
          <defs>
            <linearGradient id="line-brand-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.8} />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity={0.2} />
            </linearGradient>
            <linearGradient id="line-muted-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--muted-foreground)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="var(--border)" stopOpacity={0.1} />
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
                  stroke={node.existsLocally ? "var(--brand)" : "var(--border)"}
                  strokeWidth={node.existsLocally ? 2.5 : 1.5}
                  className="transition-all duration-300 group-hover:scale-115 group-hover:stroke-brand"
                />
                {/* Node Center Fill */}
                <circle
                  r={9}
                  fill={node.existsLocally ? "var(--brand)" : "var(--muted)"}
                  className="opacity-70 group-hover:opacity-100 transition-opacity"
                />
                {/* Node Label (Number index) */}
                <text
                  textAnchor="middle"
                  y={3}
                  fill={node.existsLocally ? "var(--brand-foreground)" : "var(--muted-foreground)"}
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
            <span>Năm: <strong className="text-foreground">{hoveredNode.year}</strong></span>
            <span>•</span>
            <span>Trích dẫn: <strong className="text-brand font-bold">{(hoveredNode.citations ?? 0).toLocaleString()}</strong></span>
          </div>
          {hoveredNode.existsLocally && (
            <div className="mt-2 text-[9px] text-brand font-bold flex items-center gap-0.5">
              <ArrowUpRight className="size-3" /> Nhấp để xem bài viết này
            </div>
          )}
        </div>
      )}

      {/* Selected Node Panel (Bottom Slide-in) */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 left-4 z-10 p-4 rounded-xl bg-popover/95 border border-brand/30 backdrop-blur shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-up">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand/10 text-brand">
                {graphType === "references" ? "Bài viết được trích dẫn" : "Bài viết trích dẫn"} #{positionedNodes.find(n => n.openAlexId === selectedNode.openAlexId)?.index! + 1}
              </span>
              {selectedNode.existsLocally ? (
                <span className="text-[9px] font-mono bg-success/10 text-success px-1.5 py-0.5 rounded border border-success/20">Có sẵn trong hệ thống</span>
              ) : (
                <span className="text-[9px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Ngoài hệ thống</span>
              )}
            </div>
            <h4 className="text-sm font-bold text-foreground line-clamp-1 leading-snug">{selectedNode.title}</h4>
            <p className="text-[10px] text-muted-foreground font-mono mt-1">
              Năm: <span className="text-foreground font-bold">{selectedNode.year}</span> · Trích dẫn: <span className="text-brand font-bold">{(selectedNode.citations ?? 0).toLocaleString()}</span> {selectedNode.doi && `· DOI: ${selectedNode.doi}`}
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
                <FileText className="size-3.5" /> Xem chi tiết
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
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
