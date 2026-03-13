"use client";

import { BRANCH_COLORS } from "@/lib/tree-utils";

interface TreeTrunkProps {
  x: number;
  bottomY: number;
  topY: number;
}

export function TreeTrunk({ x, bottomY, topY }: TreeTrunkProps) {
  const width = 12;

  const path = `
    M ${x - width} ${bottomY}
    C ${x - width} ${bottomY - 20}, ${x - width * 0.6} ${topY + 30}, ${x - width * 0.4} ${topY}
    L ${x + width * 0.4} ${topY}
    C ${x + width * 0.6} ${topY + 30}, ${x + width} ${bottomY - 20}, ${x + width} ${bottomY}
    Z
  `;

  return (
    <path
      d={path}
      fill={BRANCH_COLORS.trunk}
      stroke={BRANCH_COLORS.trunkLight}
      strokeWidth={0.5}
    />
  );
}
