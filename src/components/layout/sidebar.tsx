"use client";

import { useTreeStore } from "@/stores/tree-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TreeNode } from "@/types/tree";

function countByType(node: TreeNode, type: string): number {
  let count = node.type === type ? 1 : 0;
  if (node.children) {
    count += node.children.reduce((sum, child) => sum + countByType(child, type), 0);
  }
  return count;
}

export function Sidebar() {
  const { treeData, selectedNodeId, setSelectedNodeId } = useTreeStore();
  const departments = treeData.children || [];

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold text-foreground">{treeData.name}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {countByType(treeData, "employee")} employees &middot;{" "}
          {countByType(treeData, "recommended_role")} open roles
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {departments.map((dept) => {
            const employees = countByType(dept, "employee");
            const buds = countByType(dept, "recommended_role");
            const isSelected = selectedNodeId === dept.id;

            return (
              <button
                key={dept.id}
                onClick={() => setSelectedNodeId(isSelected ? null : dept.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <span className="font-medium">{dept.name}</span>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {employees}
                  </span>
                  {buds > 0 && (
                    <Badge variant="secondary" className="h-5 bg-[hsl(42,55%,52%)]/15 text-[hsl(42,55%,52%)] text-[10px] px-1.5">
                      <Sparkles className="mr-0.5 h-2.5 w-2.5" />
                      {buds}
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
