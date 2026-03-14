import type { TreeNode, PositionedTreeNode } from "@/types/tree";

function countDescendants(node: TreeNode): number {
  if (!node.children || node.children.length === 0) return 0;
  return node.children.reduce(
    (sum, child) => sum + 1 + countDescendants(child),
    0
  );
}

export function getBranchThickness(descendantCount: number): number {
  const base = 2;
  return Math.log2(descendantCount + 1) * base + 1;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function countLeaves(node: TreeNode): number {
  if (!node.children || node.children.length === 0) return 1;
  return node.children.reduce((sum, child) => sum + countLeaves(child), 0);
}

export function layoutTree(
  root: TreeNode,
  width: number,
  height: number
): PositionedTreeNode {
  const totalLeaves = countLeaves(root);
  const padding = width * 0.08;
  const usableWidth = width - padding * 2;
  const trunkBaseY = height * 0.95;
  const canopyTopY = height * 0.08;
  const canopyHeight = trunkBaseY - canopyTopY;

  function getMaxDepth(node: TreeNode, depth: number = 0): number {
    if (!node.children || node.children.length === 0) return depth;
    return Math.max(...node.children.map((c) => getMaxDepth(c, depth + 1)));
  }
  const maxDepth = getMaxDepth(root);

  let leafCounter = 0;

  // Compute the horizontal range each node spans based on its leaves
  function getLeafRange(node: TreeNode): { start: number; end: number } {
    if (!node.children || node.children.length === 0) {
      const idx = leafCounter++;
      const x = padding + (idx / Math.max(totalLeaves - 1, 1)) * usableWidth;
      return { start: x, end: x };
    }
    let start = Infinity;
    let end = -Infinity;
    for (const child of node.children) {
      const range = getLeafRange(child);
      start = Math.min(start, range.start);
      end = Math.max(end, range.end);
    }
    return { start, end };
  }
  const ranges = new Map<string, { start: number; end: number }>();
  function buildRanges(node: TreeNode) {
    leafCounter = 0;
    function walk(n: TreeNode) {
      if (!n.children || n.children.length === 0) {
        const idx = leafCounter++;
        const x = padding + (idx / Math.max(totalLeaves - 1, 1)) * usableWidth;
        ranges.set(n.id, { start: x, end: x });
        return;
      }
      let start = Infinity;
      let end = -Infinity;
      for (const child of n.children) {
        walk(child);
        const cr = ranges.get(child.id)!;
        start = Math.min(start, cr.start);
        end = Math.max(end, cr.end);
      }
      ranges.set(n.id, { start, end });
    }
    walk(node);
  }
  buildRanges(root);

  leafCounter = 0;

  function position(
    node: TreeNode,
    depth: number,
    seed: number
  ): PositionedTreeNode {
    const descendants = countDescendants(node);
    const isLeaf = !node.children || node.children.length === 0;

    // Y: root at trunk base, each level goes up proportionally
    const depthFraction = depth / Math.max(maxDepth, 1);
    const y = trunkBaseY - depthFraction * canopyHeight;

    if (isLeaf) {
      const idx = leafCounter++;
      const x = padding + (idx / Math.max(totalLeaves - 1, 1)) * usableWidth;
      // Zero offset — leaves sit exactly at branch tip
      const offsetX = 0;
      const offsetY = 0;

      return {
        ...node,
        x,
        y,
        offsetX,
        offsetY,
        depth,
        descendantCount: descendants,
        children: undefined,
      };
    }

    const positionedChildren = node.children!.map((child, i) =>
      position(child, depth + 1, seed * 31 + i * 17)
    );

    // X: center of the node's leaf range
    const range = ranges.get(node.id)!;
    const x = (range.start + range.end) / 2;

    const offsetX = depth === 0 ? 0 : (seededRandom(seed * 11 + 5) - 0.5) * 4;
    const offsetY = depth === 0 ? 0 : (seededRandom(seed * 17 + 11) - 0.5) * 3;

    return {
      ...node,
      x,
      y,
      offsetX,
      offsetY,
      depth,
      descendantCount: descendants,
      children: positionedChildren,
    };
  }

  return position(root, 0, 42);
}

export function generateBranchPath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  seed: number
): string {
  const midY = fromY + (toY - fromY) * 0.5;
  const cpOffset = (seededRandom(seed * 23 + 13) - 0.5) * 15;

  const cp1x = fromX + cpOffset * 0.3;
  const cp1y = midY + (seededRandom(seed * 29 + 7) - 0.5) * 10;
  const cp2x = toX - cpOffset * 0.3;
  const cp2y = midY + (seededRandom(seed * 37 + 11) - 0.5) * 10;

  return `M ${fromX} ${fromY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toX} ${toY}`;
}

export const LEAF_COLORS = [
  "hsl(130, 30%, 40%)",
  "hsl(145, 35%, 45%)",
  "hsl(155, 25%, 38%)",
  "hsl(120, 28%, 42%)",
  "hsl(138, 32%, 43%)",
];

export const BRANCH_COLORS = {
  trunk: "hsl(25, 35%, 28%)",
  trunkLight: "hsl(30, 40%, 38%)",
  branch: "hsl(28, 30%, 33%)",
  twig: "hsl(140, 25%, 35%)",
};

export const BUD_COLOR = "hsl(42, 65%, 55%)";
