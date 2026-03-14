"use client";

import { useRef, useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Environment, Float } from "@react-three/drei";
import { useTreeStore } from "@/stores/tree-store";
import { useTreeLayout3D, PositionedTreeNode3D } from "@/components/tree-3d/use-tree-layout-3d";
import { TreeTrunk3D } from "./tree-trunk-3d";
import { TreeBranch3D } from "./tree-branch-3d";
import { TreeLeaf3D } from "./tree-leaf-3d";
import { TreeBud3D } from "./tree-bud-3d";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

// Helper to flatten tree for rendering
function flattenTree(
  node: PositionedTreeNode3D,
  nodes: PositionedTreeNode3D[],
  branches: { from: PositionedTreeNode3D; to: PositionedTreeNode3D }[]
) {
  nodes.push(node);
  if (node.children) {
    for (const child of node.children) {
      branches.push({ from: node, to: child });
      flattenTree(child, nodes, branches);
    }
  }
}

const priorityColors: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400",
  high: "bg-orange-500/15 text-orange-400",
  medium: "bg-yellow-500/15 text-yellow-400",
  low: "bg-blue-500/15 text-blue-400",
};

export function TreeCanvas3D() {
  const { treeData, setSelectedNodeId } = useTreeStore();
  const layoutRoot = useTreeLayout3D(treeData);
  const [hoveredNode, setHoveredNode] = useState<PositionedTreeNode3D | null>(null);
  const [selectedBud, setSelectedBud] = useState<PositionedTreeNode3D | null>(null);

  const { nodes, branches } = useMemo(() => {
    const nodes: PositionedTreeNode3D[] = [];
    const branches: { from: PositionedTreeNode3D; to: PositionedTreeNode3D }[] = [];
    if (layoutRoot) {
      flattenTree(layoutRoot, nodes, branches);
    }
    return { nodes, branches };
  }, [layoutRoot]);

  const handleNodeClick = (node: PositionedTreeNode3D) => {
    if (node.type === "recommended_role") {
      setSelectedBud(node);
    } else {
      setSelectedNodeId(node.id);
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg bg-slate-950">
      <Canvas camera={{ position: [40, 60, 80], fov: 45 }}>
        <fog attach="fog" args={['#020617', 50, 300]} />
        <ambientLight intensity={0.4} />
        <pointLight position={[20, 30, 20]} intensity={1} color="#fbbf24" distance={50} decay={2} />
        <directionalLight position={[-10, 50, -20]} intensity={0.8} color="#f1f5f9" />
        <Stars radius={200} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />
        <Environment preset="night" blur={0.6} />
        
        <OrbitControls 
            enablePan={true} 
            enableZoom={true} 
            enableRotate={true}
            minDistance={20}
            maxDistance={250}
            target={[0, 40, 0]} // Look at middle of tree
            autoRotate={true}
            autoRotateSpeed={0.5}
        />

        <group position={[0, -20, 0]}> {/* Shift whole tree down slightly */}
          <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
            {/* Trunk Base */}
            <TreeTrunk3D height={20} />

            {/* Branches */}
            {branches.map((b, i) => (
              <TreeBranch3D key={`branch-${i}`} from={b.from} to={b.to} index={i} />
            ))}

            {/* Nodes (Leaves, Buds, etc) */}
            {nodes.map((node, i) => {
              if (node.type === "employee") {
                return (
                  <TreeLeaf3D
                    key={node.id}
                    node={node}
                    index={i}
                    onHover={setHoveredNode}
                    onClick={handleNodeClick}
                  />
                );
              } else if (node.type === "recommended_role") {
                return (
                  <TreeBud3D
                    key={node.id}
                    node={node}
                    index={i}
                    onHover={setHoveredNode}
                    onClick={handleNodeClick}
                  />
                );
              }
              return null; // Don't render "department" nodes as separate meshes, handled by branches
            })}
          </Float>
        </group>
      </Canvas>

      {/* Overlay UI for tooltip/details */}
      {hoveredNode && (
         <div 
           className="absolute pointer-events-none p-3 bg-slate-900/90 backdrop-blur-md rounded-lg text-white border border-white/10 shadow-xl transition-all duration-200"
           style={{ 
             left: "50%", 
             top: "10%", 
             transform: "translateX(-50%)" 
           }}
         >
            <h3 className="font-bold text-lg text-center">{hoveredNode.name}</h3>
            <p className="text-xs text-center text-slate-400 uppercase tracking-wider">{hoveredNode.role || hoveredNode.type}</p>
         </div>
      )}

      <Sheet open={!!selectedBud} onOpenChange={(open) => !open && setSelectedBud(null)}>
        <SheetContent className="border-border bg-card">
          <SheetHeader>
            <SheetTitle className="text-foreground">{selectedBud?.name}</SheetTitle>
            <SheetDescription>{selectedBud?.department}</SheetDescription>
          </SheetHeader>
          {selectedBud && (
            <div className="mt-4 space-y-4 px-1">
              {selectedBud.priority && (
                <Badge
                  variant="secondary"
                  className={priorityColors[selectedBud.priority] || ""}
                >
                  {selectedBud.priority} priority
                </Badge>
              )}
              {selectedBud.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedBud.description}
                </p>
              )}
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Recommended Role
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {selectedBud.role}
                </p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}