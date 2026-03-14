"use client";

import { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { PositionedTreeNode3D } from "@/components/tree-3d/use-tree-layout-3d";

interface TreeBud3DProps {
  node: PositionedTreeNode3D;
  index: number;
  onHover: (node: PositionedTreeNode3D | null) => void;
  onClick: (node: PositionedTreeNode3D) => void;
}

export function TreeBud3D({ node, index, onHover, onClick }: TreeBud3DProps) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      // Pulsing effect
      const scale = 1 + Math.sin(t * 2 + index) * 0.1;
      meshRef.current.scale.setScalar(hovered ? scale * 1.5 : scale);
    }
  });

  return (
    <group position={[node.x, node.y, node.z]}>
      <mesh
        ref={meshRef}
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
        <octahedronGeometry args={[2, 0]} />
        <meshStandardMaterial 
          color="#fbbf24" 
          emissive="#fbbf24"
          emissiveIntensity={hovered ? 1 : 0.5}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      
      {/* Glow effect handled by emissive, but could add a point light if needed */}
      {hovered && <pointLight distance={10} intensity={2} color="#fbbf24" decay={2} />}
    </group>
  );
}