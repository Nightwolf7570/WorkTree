import { useMemo } from "react";
import type { TreeNode } from "@/types/tree";

export interface PositionedTreeNode3D extends TreeNode {
  x: number;
  y: number;
  z: number;
  depth: number;
  children?: PositionedTreeNode3D[];
  descendantCount: number;
}

// Helper to count descendants for weighting
function countDescendants(node: TreeNode): number {
  if (!node.children || node.children.length === 0) return 1;
  return node.children.reduce((sum, child) => sum + countDescendants(child), 0);
}

// Helper: Seeded random
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function layoutNode(
  node: TreeNode,
  depth: number,
  startAngle: number,
  endAngle: number,
  totalDescendants: number
): PositionedTreeNode3D {
  // Config
  const LEVEL_HEIGHT = 20; // Vertical distance between levels
  const INITIAL_RADIUS = 0;
  const GROWTH_RADIUS = 25; // Radial distance between levels
  
  let x = 0, y = 0, z = 0;
  
  // Root at (0,0,0)
  if (depth === 0) {
    x = 0;
    y = 0;
    z = 0;
  } else {
    // Position based on the MIDPOINT of the allocated sector
    const angle = startAngle + (endAngle - startAngle) / 2;
    
    // Add some organic variance to radius and height
    const seed = depth * 13 + angle * 23;
    const rVariance = (seededRandom(seed) - 0.5) * 5;
    const hVariance = (seededRandom(seed + 1) - 0.5) * 5;
    
    const radius = (depth * GROWTH_RADIUS) + rVariance;
    
    x = Math.cos(angle) * radius;
    z = Math.sin(angle) * radius;
    y = (depth * LEVEL_HEIGHT) + hVariance;
  }

  // Process Children
  let children: PositionedTreeNode3D[] | undefined;
  
  if (node.children && node.children.length > 0) {
    children = [];
    let currentStartAngle = startAngle;
    
    // Calculate total weight of children for this node to distribute the sector
    const childrenWeights = node.children.map(c => countDescendants(c));
    const childrenTotalWeight = childrenWeights.reduce((a, b) => a + b, 0);
    
    const sectorSize = endAngle - startAngle;

    node.children.forEach((child, i) => {
      const weight = childrenWeights[i];
      // Proportion of the parent's sector this child gets
      const share = weight / childrenTotalWeight;
      const mySectorSize = sectorSize * share;
      
      children!.push(layoutNode(
        child,
        depth + 1,
        currentStartAngle,
        currentStartAngle + mySectorSize,
        weight
      ));
      
      currentStartAngle += mySectorSize;
    });
  }

  return {
    ...node,
    x,
    y,
    z,
    depth,
    children,
    descendantCount: totalDescendants
  };
}

export function useTreeLayout3D(root: TreeNode) {
  return useMemo(() => {
    const totalDescendants = countDescendants(root);
    // Start with full 360 degrees (0 to 2PI)
    return layoutNode(root, 0, 0, Math.PI * 2, totalDescendants);
  }, [root]);
}