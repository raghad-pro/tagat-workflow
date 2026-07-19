"use client"

import { useRef, useMemo, useEffect, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { useTheme } from "next-themes"

function DataConstellation({ isDark }: { isDark: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  
  // Exact logo color requested by user
  const primaryColor = "#12c2e9" 
  const secondaryColor = "#12c2e9" 
  const lineColor = "#12c2e9" 
  
  // Increased opacities slightly to make it darker/stronger
  const lineOpacity = isDark ? 0.15 : 0.25 
  const pointOpacity = isDark ? 0.8 : 0.75
  const ringOpacity = isDark ? 0.15 : 0.2
  
  // Generate points, connecting lines, and binary digits
  const { positions, lines, colors } = useMemo(() => {
    const pts = []
    const numPoints = 250 // Increased significantly for a much denser network
    const radius = 10 // Slightly larger radius to accommodate more points
    
    for (let i = 0; i < numPoints; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos((Math.random() * 2) - 1)
      const x = radius * Math.sin(phi) * Math.cos(theta) * 1.8 
      const y = radius * Math.sin(phi) * Math.sin(theta) * 1.2
      const z = radius * Math.cos(phi)
      
      const r = 0.5 + Math.random() * 0.7
      pts.push(new THREE.Vector3(x * r, y * r, z * r))
    }

    const linePositions = []
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        // Increased connection distance to draw more lines between points
        if (pts[i].distanceTo(pts[j]) < 5.5) {
          linePositions.push(pts[i].x, pts[i].y, pts[i].z)
          linePositions.push(pts[j].x, pts[j].y, pts[j].z)
        }
      }
    }

    const positionsArray = new Float32Array(pts.flatMap((p: any) => [p.x, p.y, p.z]))
    const linesArray = new Float32Array(linePositions)
    
    const colorsArray = new Float32Array(pts.length * 3)
    const color1 = new THREE.Color(primaryColor)
    const color2 = new THREE.Color(secondaryColor)
    
    for (let i = 0; i < pts.length; i++) {
      // 80% secondary (softer blue), 20% primary (cyan) for subtle highlights
      const c = Math.random() > 0.8 ? color1 : color2
      colorsArray[i * 3] = c.r
      colorsArray[i * 3 + 1] = c.g
      colorsArray[i * 3 + 2] = c.b
    }

    return { positions: positionsArray, lines: linesArray, colors: colorsArray }
  }, [primaryColor, secondaryColor])

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05 // Smoother, slower rotation
      groupRef.current.rotation.x += delta * 0.02
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.5
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, -6]}>
      {/* Points */}
      <points>
        <bufferGeometry>
          {/* @ts-ignore */}
          <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
          {/* @ts-ignore */}
          <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.15} vertexColors transparent opacity={pointOpacity} sizeAttenuation={true} />
      </points>

      {/* Lines connecting points */}
      <lineSegments>
        <bufferGeometry>
          {/* @ts-ignore */}
          <bufferAttribute attach="attributes-position" count={lines.length / 3} array={lines} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color={lineColor} transparent opacity={lineOpacity} />
      </lineSegments>

      {/* Large orbital rings */}
      {[5.5, 8.5, 12].map((r, i) => (
        <mesh key={i} rotation={[Math.PI / 3 + i * 0.25, Math.PI / 4, 0]}>
          <ringGeometry args={[r, r + 0.02, 64]} />
          <meshBasicMaterial color={primaryColor} transparent opacity={ringOpacity} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

export function HeroBackground() {
  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = theme === 'system' ? systemTheme : theme
  const isDark = mounted ? currentTheme === 'dark' : false

  return (
    <div className="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-100 bg-transparent">
      {/* Set z-0 so it stays above the page background, and bg-transparent so it blends natively */}
      <Canvas camera={{ position: [0, 0, 16], fov: 45 }}>
        {/* Very soft fog to blend things beautifully into the background */}
        <fog attach="fog" args={[isDark ? "#020817" : "#f8fafc", 10, 25]} />
        {mounted && <DataConstellation isDark={isDark} />}
      </Canvas>
    </div>
  )
}
