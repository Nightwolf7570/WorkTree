"use client";

import { BUD_COLOR } from "@/lib/tree-utils";
import type { PositionedTreeNode } from "@/types/tree";

interface TreeBudProps {
  node: PositionedTreeNode;
  index: number;
  onHover: (node: PositionedTreeNode | null) => void;
  onClick: (node: PositionedTreeNode) => void;
}

export function TreeBud({ node, index, onHover, onClick }: TreeBudProps) {
  const x = node.x + node.offsetX;
  const y = node.y + node.offsetY;

  return (
    <g
      style={{ cursor: "pointer" }}
      onMouseEnter={() => onHover(node)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(node)}
    >
      <circle
        cx={x}
        cy={y}
        r={10}
        fill={BUD_COLOR}
        opacity={0.15}
        className="animate-bud-glow"
      />
      <circle
        cx={x}
        cy={y}
        r={5}
        fill={BUD_COLOR}
        opacity={0.9}
      />
    </g>
  );
}
