"use client";

import { TreeCanvas3D } from "@/components/tree-3d/tree-canvas-3d";
import { Sidebar } from "@/components/layout/sidebar";

export default function Dashboard3DPage() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <Sidebar />
      <div className="flex-1">
        <TreeCanvas3D />
      </div>
    </div>
  );
}
