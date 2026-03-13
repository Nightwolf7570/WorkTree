export type NodeType = "company" | "department" | "team" | "employee" | "recommended_role";

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
}

export interface TreeNode {
  id: string;
  name: string;
  type: NodeType;
  role?: string;
  department?: string;
  priority?: "critical" | "high" | "medium" | "low";
  description?: string;
  socials?: SocialLinks;
  children?: TreeNode[];
}

export interface PositionedTreeNode extends TreeNode {
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  depth: number;
  descendantCount: number;
  children?: PositionedTreeNode[];
}
