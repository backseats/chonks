import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';

interface CubeProps {
  opacity: number;
  position: [number, number, number];
  color: string;
}

const Cube: React.FC<CubeProps> = ({ opacity, position, color }) => {
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      // meshRef.current.rotation.x += 0.01;
      // meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
};

export default Cube;
