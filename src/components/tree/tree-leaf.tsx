"use client";

import { LEAF_COLORS } from "@/lib/tree-utils";
import type { PositionedTreeNode } from "@/types/tree";

interface TreeLeafProps {
  node: PositionedTreeNode;
  index: number;
  onHover: (node: PositionedTreeNode | null) => void;
  onClick: (node: PositionedTreeNode) => void;
}

export function TreeLeaf({ node, index, onHover, onClick }: TreeLeafProps) {
  const color = LEAF_COLORS[index % LEAF_COLORS.length];
  const x = node.x + node.offsetX;
  const y = node.y + node.offsetY;
  const size = 6 + (index % 3);

  return (
    <ellipse
      cx={x}
      cy={y}
      rx={size}
      ry={size * 1.3}
      fill={color}
      opacity={0.85}
      style={{ cursor: "pointer" }}
      onMouseEnter={() => onHover(node)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(node)}
    />
  );
}
