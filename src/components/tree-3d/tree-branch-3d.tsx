"use client";

import { useMemo, useState } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import type { PositionedTreeNode3D } from "@/components/tree-3d/use-tree-layout-3d";

// Helper for seeded random color variation
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

interface TreeBranch3DProps {
  from: PositionedTreeNode3D;
  to: PositionedTreeNode3D;
  index: number;
}

export function TreeBranch3D({ from, to, index }: TreeBranch3DProps) {
  const [hovered, setHovered] = useState(false);
  
  // Calculate positions
  const start = new THREE.Vector3(from.x, from.y, from.z);
  const end = new THREE.Vector3(to.x, to.y, to.z);
  const distance = start.distanceTo(end);
  
  // Generate curve
  const curve = useMemo(() => {
    // Control point logic:
    // Pull the midpoint 'up' slightly to create an arch
    const mid = start.clone().add(end).multiplyScalar(0.5);
    // Add some upward curve, more pronounced for longer branches
    mid.y += distance * 0.2; 
    
    // Also add some random jitter based on index for organic feel
    const jitter = (seededRandom(index * 13) - 0.5) * (distance * 0.1);
    mid.x += jitter;
    mid.z += jitter;

    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [start, end, distance, index]);

  // Tube geometry parameters
  const segments = 8; // Low poly for performance
  const radius = Math.max(0.2, (10 - to.depth * 2) * 0.1); // Thinner at tips
  
  // Color logic
  const baseColor = new THREE.Color("#5D4037"); // Dark wood
  const tipColor = new THREE.Color("#8D6E63"); // Lighter wood
  const color = hovered ? "#4ade80" : baseColor.lerp(tipColor, to.depth / 5);

  return (
    <group>
      <mesh 
        castShadow 
        receiveShadow
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={(e) => setHovered(false)}
      >
        <tubeGeometry args={[curve, segments, radius, 6, false]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.8}
        />
      </mesh>
      
      {/* Label for Departments (Depth 1) */}
      {to.depth === 1 && (
        <Html position={[midPoint(start, end).x, midPoint(start, end).y + 2, midPoint(start, end).z]} center>
          <div className="bg-slate-900/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap backdrop-blur-sm border border-white/10 pointer-events-none select-none">
            {to.name}
          </div>
        </Html>
      )}
    </group>
  );
}

function midPoint(v1: THREE.Vector3, v2: THREE.Vector3) {
  return v1.clone().add(v2).multiplyScalar(0.5);
}