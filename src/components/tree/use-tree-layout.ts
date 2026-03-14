"use client";

import { useMemo } from "react";
import type { TreeNode, PositionedTreeNode } from "@/types/tree";
import { layoutTree } from "@/lib/tree-utils";

export function useTreeLayout(
  root: TreeNode,
  width: number,
  height: number
): PositionedTreeNode | null {
  return useMemo(() => {
    if (width === 0 || height === 0) return null;
    return layoutTree(root, width, height);
  }, [root, width, height]);
}
