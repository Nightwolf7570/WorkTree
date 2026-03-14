"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useTreeStore } from "@/stores/tree-store";
import { useTreeLayout } from "./use-tree-layout";
import { TreeTrunk } from "./tree-trunk";
import { TreeBranch } from "./tree-branch";
import { TreeLeaf } from "./tree-leaf";
import { TreeBud } from "./tree-bud";
import { TreeTooltip } from "./tree-tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import type { PositionedTreeNode } from "@/types/tree";

// Delay before hiding tooltip to allow mouse to reach it
const TOOLTIP_HIDE_DELAY = 150;

function collectBranches(
  node: PositionedTreeNode,
  result: { from: PositionedTreeNode; to: PositionedTreeNode; index: number }[],
  counter: { value: number }
) {
  if (node.children) {
    for (const child of node.children) {
      result.push({ from: node, to: child, index: counter.value++ });
      collectBranches(child, result, counter);
    }
  }
}

function collectLeaves(
  node: PositionedTreeNode,
  employees: PositionedTreeNode[],
  buds: PositionedTreeNode[]
) {
  if (node.type === "employee") {
    employees.push(node);
  } else if (node.type === "recommended_role") {
    buds.push(node);
  }
  if (node.children) {
    for (const child of node.children) {
      collectLeaves(child, employees, buds);
    }
  }
}

const priorityColors: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400",
  high: "bg-orange-500/15 text-orange-400",
  medium: "bg-yellow-500/15 text-yellow-400",
  low: "bg-blue-500/15 text-blue-400",
};

export function TreeCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredNode, setHoveredNode] = useState<PositionedTreeNode | null>(null);
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const [selectedBud, setSelectedBud] = useState<PositionedTreeNode | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { treeData, zoomLevel, panOffset, setZoomLevel, setPanOffset, setSelectedNodeId } = useTreeStore();

  const layoutRoot = useTreeLayout(treeData, dimensions.width, dimensions.height);

  // Handle hover with delay for tooltip accessibility
  const handleNodeHover = useCallback((node: PositionedTreeNode | null) => {
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    if (node) {
      // Show immediately
      setHoveredNode(node);
    } else {
      // Delay hiding to allow mouse to reach tooltip
      hideTimeoutRef.current = setTimeout(() => {
        // Only hide if tooltip itself isn't hovered
        setHoveredNode((current) => {
          // This will be checked again in render via isTooltipHovered
          return current;
        });
        // Actually hide after checking tooltip hover state
        if (!isTooltipHovered) {
          setHoveredNode(null);
        }
      }, TOOLTIP_HIDE_DELAY);
    }
  }, [isTooltipHovered]);

  const handleTooltipMouseEnter = useCallback(() => {
    setIsTooltipHovered(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const handleTooltipMouseLeave = useCallback(() => {
    setIsTooltipHovered(false);
    // Hide tooltip after leaving it
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredNode(null);
    }, TOOLTIP_HIDE_DELAY);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoomLevel(zoomLevel + delta);
    },
    [zoomLevel, setZoomLevel]
  );

  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isPanning.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning.current) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy });
    },
    [panOffset, setPanOffset]
  );

  const handlePointerUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const handleNodeClick = useCallback(
    (node: PositionedTreeNode) => {
      if (node.type === "recommended_role") {
        setSelectedBud(node);
      } else {
        setSelectedNodeId(node.id);
      }
    },
    [setSelectedNodeId]
  );

  const branches: { from: PositionedTreeNode; to: PositionedTreeNode; index: number }[] = [];
  const employees: PositionedTreeNode[] = [];
  const buds: PositionedTreeNode[] = [];

  if (layoutRoot) {
    collectBranches(layoutRoot, branches, { value: 0 });
    collectLeaves(layoutRoot, employees, buds);
  }

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden rounded-lg bg-background">
      <svg
        width={dimensions.width}
        height={dimensions.height}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ touchAction: "none" }}
      >
        <g
          transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}
        >
          {layoutRoot && (
            <TreeTrunk
              x={layoutRoot.x}
              bottomY={dimensions.height}
              topY={layoutRoot.y + layoutRoot.offsetY}
            />
          )}

          {branches.map((b, i) => (
            <TreeBranch key={`branch-${i}`} from={b.from} to={b.to} index={b.index} />
          ))}

          {employees.map((node, i) => (
            <TreeLeaf
              key={node.id}
              node={node}
              index={i}
              onHover={handleNodeHover}
              onClick={handleNodeClick}
            />
          ))}

          {buds.map((node, i) => (
            <TreeBud
              key={node.id}
              node={node}
              index={i}
              onHover={handleNodeHover}
              onClick={handleNodeClick}
            />
          ))}
        </g>
      </svg>

      {hoveredNode && (
        <TreeTooltip 
          node={hoveredNode} 
          containerZoom={zoomLevel} 
          containerPan={panOffset}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        />
      )}

      <Sheet open={!!selectedBud} onOpenChange={(open) => !open && setSelectedBud(null)}>
        <SheetContent className="border-border bg-card">
          <SheetHeader>
            <SheetTitle className="text-foreground">{selectedBud?.name}</SheetTitle>
            <SheetDescription>{selectedBud?.department}</SheetDescription>
          </SheetHeader>
          {selectedBud && (
            <div className="mt-4 space-y-4 px-1">
              {selectedBud.priority && (
                <Badge
                  variant="secondary"
                  className={priorityColors[selectedBud.priority] || ""}
                >
                  {selectedBud.priority} priority
                </Badge>
              )}
              {selectedBud.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedBud.description}
                </p>
              )}
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Recommended Role
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {selectedBud.role}
                </p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
