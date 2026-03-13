"use client";

import { useState } from "react";
import { generateBranchPath, getBranchThickness, BRANCH_COLORS } from "@/lib/tree-utils";
import type { PositionedTreeNode } from "@/types/tree";

interface TreeBranchProps {
  from: PositionedTreeNode;
  to: PositionedTreeNode;
  index: number;
}

export function TreeBranch({ from, to, index }: TreeBranchProps) {
  const [hovered, setHovered] = useState(false);
  const thickness = getBranchThickness(to.descendantCount);
  const fromX = from.x + from.offsetX;
  const fromY = from.y + from.offsetY;
  const toX = to.x + to.offsetX;
  const toY = to.y + to.offsetY;
  const path = generateBranchPath(fromX, fromY, toX, toY, index * 7 + from.depth * 13);

  const isDeep = to.depth >= 3;
  const color = isDeep ? BRANCH_COLORS.twig : BRANCH_COLORS.branch;

  const isDepartmentBranch = to.type === "department";
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: isDepartmentBranch ? "pointer" : undefined }}
    >
      {/* Wider hit area */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(thickness + 10, 14)}
        strokeLinecap="round"
      />
      <path
        d={path}
        fill="none"
        stroke={hovered ? "hsl(160, 30%, 50%)" : color}
        strokeWidth={thickness}
        strokeLinecap="round"
      />
      {isDepartmentBranch && hovered && (
        <g>
          <rect
            x={midX - (to.name.length * 4 + 12)}
            y={midY - 12}
            width={to.name.length * 8 + 24}
            height={24}
            rx={6}
            fill="hsl(200, 8%, 12%)"
            stroke="hsl(200, 8%, 22%)"
            strokeWidth={1}
            opacity={0.95}
          />
          <text
            x={midX}
            y={midY + 4}
            textAnchor="middle"
            fill="hsl(40, 10%, 90%)"
            fontSize={12}
            fontWeight={500}
            fontFamily="var(--font-geist-sans), system-ui, sans-serif"
          >
            {to.name}
          </text>
        </g>
      )}
    </g>
  );
}
