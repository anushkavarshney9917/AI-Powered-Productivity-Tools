"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

// Seeded random number generator for deterministic particle positions
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function ParticleField() {
  const meshRef = useRef<THREE.Points>(null);
  const count = 500;

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (seededRandom(i * 3 + 1) - 0.5) * 20;
      positions[i * 3 + 1] = (seededRandom(i * 3 + 2) - 0.5) * 20;
      positions[i * 3 + 2] = (seededRandom(i * 3 + 3) - 0.5) * 20;

      // Purple to blue gradient colors
      colors[i * 3] = 0.5 + seededRandom(i * 6 + 4) * 0.3; // R
      colors[i * 3 + 1] = 0.3 + seededRandom(i * 6 + 5) * 0.2; // G
      colors[i * 3 + 2] = 0.8 + seededRandom(i * 6 + 6) * 0.2; // B
    }

    return { positions, colors };
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.01;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[particles.colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

function FloatingGeometry() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.1;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh ref={meshRef} position={[0, 0, -5]}>
        <icosahedronGeometry args={[2, 1]} />
        <meshBasicMaterial
          color="#8b5cf6"
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>
    </Float>
  );
}

function GradientBlob() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.05;
      const scale = 1 + Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef} position={[3, -2, -8]}>
      <sphereGeometry args={[3, 32, 32]} />
      <meshBasicMaterial color="#6366f1" transparent opacity={0.08} />
    </mesh>
  );
}

export default function HeroBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        style={{ background: "transparent" }}
      >
        <ParticleField />
        <FloatingGeometry />
        <GradientBlob />
      </Canvas>
    </div>
  );
}
