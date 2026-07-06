"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import * as THREE from "three"

function DataConstellation() {
  const groupRef = useRef<THREE.Group>(null)
  
  // Generate points, connecting lines, and binary digits
  const { positions, lines, binaryText, colors } = useMemo(() => {
    const pts = []
    const numPoints = 120
    const radius = 8
    
    // Create an elliptical/spherical cloud of points
    for (let i = 0; i < numPoints; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos((Math.random() * 2) - 1)
      const x = radius * Math.sin(phi) * Math.cos(theta) * 1.5 // stretch X for ellipse
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)
      
      const r = 0.7 + Math.random() * 0.5
      pts.push(new THREE.Vector3(x * r, y * r, z * r))
    }

    const linePositions = []
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        // connect if distance is small
        if (pts[i].distanceTo(pts[j]) < 4) {
          linePositions.push(pts[i].x, pts[i].y, pts[i].z)
          linePositions.push(pts[j].x, pts[j].y, pts[j].z)
        }
      }
    }

    // Assign binary 1 or 0 to some points
    const binary = pts.slice(0, 40).map(p => ({
      pos: [p.x + 0.3, p.y + 0.3, p.z],
      text: Math.random() > 0.5 ? "1" : "0",
      color: Math.random() > 0.5 ? "#0ea5e9" : "#ffffff"
    }))

    const positionsArray = new Float32Array(pts.flatMap(p => [p.x, p.y, p.z]))
    const linesArray = new Float32Array(linePositions)
    
    // Alternate point colors between cyan and white
    const colorsArray = new Float32Array(pts.length * 3)
    const colorCyan = new THREE.Color("#0ea5e9")
    const colorWhite = new THREE.Color("#ffffff")
    for (let i = 0; i < pts.length; i++) {
      const c = Math.random() > 0.3 ? colorCyan : colorWhite
      colorsArray[i * 3] = c.r
      colorsArray[i * 3 + 1] = c.g
      colorsArray[i * 3 + 2] = c.b
    }

    return { positions: positionsArray, lines: linesArray, binaryText: binary, colors: colorsArray }
  }, [])

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05
      groupRef.current.rotation.x += delta * 0.02
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.5
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, -5]}>
      {/* Points */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.15} vertexColors transparent opacity={0.9} sizeAttenuation={true} />
      </points>

      {/* Lines connecting points */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={lines.length / 3} array={lines} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.1} />
      </lineSegments>

      {/* Binary numbers floating */}
      {binaryText.map((item, i) => (
        <Text 
          key={i} 
          position={item.pos as [number, number, number]} 
          color={item.color} 
          fontSize={0.4} 
          opacity={0.8}
        >
          {item.text}
        </Text>
      ))}
      
      {/* Large orbital rings */}
      {[5, 8, 11].map((r, i) => (
        <mesh key={i} rotation={[Math.PI / 3 + i * 0.2, Math.PI / 4, 0]}>
          <ringGeometry args={[r, r + 0.02, 64]} />
          <meshBasicMaterial color="#0ea5e9" transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

export function HeroBackground() {
  return (
    <div className="absolute inset-0 w-full h-full -z-10 pointer-events-none opacity-100 bg-background/50">
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
        {/* Adds fog to blend particles into the distance smoothly - modified for theme support */}
        <fog attach="fog" args={["#ffffff", 10, 30]} />
        <DataConstellation />
      </Canvas>
    </div>
  )
}
