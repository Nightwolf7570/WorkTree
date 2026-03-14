"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Float } from "@react-three/drei";

interface TreeTrunk3DProps {
  height?: number;
  width?: number;
  color?: string;
}

export function TreeTrunk3D({ height = 20, width = 2, color = "#5D4037" }: TreeTrunk3DProps) {
  // A simple cylinder for the main trunk base
  // Positioned so its base is at (0,0,0) and it goes up to height
  return (
    <group position={[0, height / 2, 0]}>
      <mesh receiveShadow castShadow>
        <cylinderGeometry args={[width * 0.8, width, height, 8]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.9} 
          bumpScale={0.1}
        />
      </mesh>
    </group>
  );
}