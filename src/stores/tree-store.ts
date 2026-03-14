import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TreeNode } from "@/types/tree";
import type { PipelineResult } from "@/types/analysis";
import { transformPipelineToTree } from "@/lib/adapters";

// Empty initial tree - user builds via chat or pipeline
const emptyTree: TreeNode = {
  id: "company",
  name: "Your Company",
  type: "company",
  children: [],
};

interface TreeStore {
  treeData: TreeNode;
  selectedNodeId: string | null;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  isFromBackend: boolean;
  setSelectedNodeId: (id: string | null) => void;
  setZoomLevel: (zoom: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  setTreeData: (data: TreeNode) => void;
  addNodeToParent: (parentId: string, node: TreeNode) => void;
  removeNode: (nodeId: string) => void;
  ensureDepartment: (name: string) => string;
  ensureTeam: (departmentId: string, teamName: string) => string;
  resetTree: () => void;
  syncFromPipeline: (result: PipelineResult) => void;
}

function addToParent(tree: TreeNode, parentId: string, node: TreeNode): TreeNode {
  if (tree.id === parentId) {
    return { ...tree, children: [...(tree.children || []), node] };
  }
  if (!tree.children) return tree;
  return {
    ...tree,
    children: tree.children.map((child) => addToParent(child, parentId, node)),
  };
}

function removeFromTree(tree: TreeNode, nodeId: string): TreeNode {
  if (!tree.children) return tree;
  return {
    ...tree,
    children: tree.children
      .filter((child) => child.id !== nodeId)
      .map((child) => removeFromTree(child, nodeId)),
  };
}

function findNode(tree: TreeNode, id: string): TreeNode | null {
  if (tree.id === id) return tree;
  if (!tree.children) return null;
  for (const child of tree.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

function makeId(): string {
  return `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function deptNameToId(name: string): string {
  return `dept_${name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
}

function teamNameToId(deptId: string, name: string): string {
  return `${deptId}_team_${name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
}

export const useTreeStore = create<TreeStore>()(
  persist(
    (set, get) => ({
      treeData: emptyTree,
      selectedNodeId: null,
      zoomLevel: 1,
      panOffset: { x: 0, y: 0 },
      isFromBackend: false,
      setSelectedNodeId: (id) => set({ selectedNodeId: id }),
      setZoomLevel: (zoom) => set({ zoomLevel: Math.max(0.5, Math.min(3, zoom)) }),
      setPanOffset: (offset) => set({ panOffset: offset }),
      setTreeData: (data) => set({ treeData: data }),

      addNodeToParent: (parentId, node) => {
        set((state) => ({ treeData: addToParent(state.treeData, parentId, node) }));
      },

      removeNode: (nodeId) => {
        set((state) => ({ treeData: removeFromTree(state.treeData, nodeId) }));
      },

      ensureDepartment: (name: string): string => {
        const id = deptNameToId(name);
        const existing = findNode(get().treeData, id);
        if (existing) return id;
        const dept: TreeNode = {
          id,
          name,
          type: "department",
          children: [],
        };
        set((state) => ({
          treeData: addToParent(state.treeData, state.treeData.id, dept),
        }));
        return id;
      },

      ensureTeam: (departmentId: string, teamName: string): string => {
        const id = teamNameToId(departmentId, teamName);
        const existing = findNode(get().treeData, id);
        if (existing) return id;
        const team: TreeNode = {
          id,
          name: teamName,
          type: "team",
          children: [],
        };
        set((state) => ({
          treeData: addToParent(state.treeData, departmentId, team),
        }));
        return id;
      },

      resetTree: () => set({ treeData: emptyTree, isFromBackend: false }),
      
      syncFromPipeline: (result: PipelineResult) => {
        const newTree = transformPipelineToTree(result);
        set({ treeData: newTree, isFromBackend: true });
      },
    }),
    {
      name: "worktree-tree",
      partialize: (state) => ({ treeData: state.treeData, isFromBackend: state.isFromBackend }),
    }
  )
);

export { makeId };
