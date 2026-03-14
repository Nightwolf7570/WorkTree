"use client";

import { useMemo, useState, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { PositionedTreeNode3D } from "@/components/tree-3d/use-tree-layout-3d";

interface TreeLeaf3DProps {
  node: PositionedTreeNode3D;
  index: number;
  onHover: (node: PositionedTreeNode3D | null) => void;
  onClick: (node: PositionedTreeNode3D) => void;
}

export function TreeLeaf3D({ node, index, onHover, onClick }: TreeLeaf3DProps) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Random variance
  const scale = useMemo(() => 0.8 + Math.random() * 0.4, []);
  const rotation = useMemo(() => [Math.random(), Math.random(), Math.random()], []);

  // Simple animation for leaves swaying?
  useFrame((state) => {
    if (meshRef.current) {
       const t = state.clock.getElapsedTime();
       meshRef.current.rotation.x = rotation[0] + Math.sin(t * 0.5 + index) * 0.1;
       meshRef.current.rotation.y = rotation[1] + Math.cos(t * 0.3 + index) * 0.1;
    }
  });

  const color = useMemo(() => {
    const colors = ["#4ade80", "#22c55e", "#16a34a", "#15803d", "#166534"];
    return colors[index % colors.length];
  }, [index]);

  return (
    <group position={[node.x, node.y, node.z]}>
      <mesh
        ref={meshRef}
        scale={hovered ? scale * 1.5 : scale}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onClick(node);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover(node);
        }}
        onPointerOut={(e) => {
          setHovered(false);
          onHover(null);
        }}
      >
        {/* Using Icosahedron for a more organic/poly look than sphere */}
        <icosahedronGeometry args={[1.5, 0]} />
        <meshStandardMaterial 
          color={hovered ? "#fbbf24" : color} 
          roughness={0.8}
        />
      </mesh>
    </group>
  );
}
