"use client";

import { TreeCanvas } from "@/components/tree/tree-canvas";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardPage() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <Sidebar />
      <div className="flex-1">
        <TreeCanvas />
      </div>
    </div>
  );
}
