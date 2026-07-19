'use client'

import { useApp } from '../context/AppContext'
import { useNearViewport, useReducedMotion } from '../hooks'

// World-map hero background (adapted from the Aceternity WorldMap component).
// Changes vs the original:
//  - No framer-motion / next-themes / Tailwind — theme comes from AppContext,
//    the arc animation is pure CSS (a light pulse travelling along each arc
//    on an infinite seamless loop instead of a one-shot draw).
//  - The dotted map is NOT generated in the browser: scripts/generate-map.mjs
//    pre-bakes /map-light.svg and /map-dark.svg at build time, so neither the
//    dotted-map library nor its geodata ever ships to visitors.
//  - Light mode: original look (soft black dots, sky-blue arcs).
//    Dark mode: blue map dots with glowing "city lights" and cyan arcs.

const ROUTES = [
  { start: { lat: 31.5, lng: 34.47 }, end: { lat: 51.5074, lng: -0.1278 } }, // Gaza → London
  { start: { lat: 31.5, lng: 34.47 }, end: { lat: 25.2048, lng: 55.2708 } }, // Gaza → Dubai
  { start: { lat: 31.5, lng: 34.47 }, end: { lat: 40.7128, lng: -74.006 } }, // Gaza → New York
  { start: { lat: 40.7128, lng: -74.006 }, end: { lat: 34.0522, lng: -118.2437 } }, // New York → LA
  { start: { lat: 51.5074, lng: -0.1278 }, end: { lat: 28.6139, lng: 77.209 } }, // London → New Delhi
  { start: { lat: 28.6139, lng: 77.209 }, end: { lat: 35.6762, lng: 139.6503 } }, // New Delhi → Tokyo
  { start: { lat: 25.2048, lng: 55.2708 }, end: { lat: -1.2921, lng: 36.8219 } }, // Dubai → Nairobi
]

const projectPoint = (lat: number, lng: number) => ({
  x: (lng + 180) * (800 / 360),
  y: (90 - lat) * (400 / 180),
})

const createCurvedPath = (start: { x: number; y: number }, end: { x: number; y: number }) => {
  const midX = (start.x + end.x) / 2
  const midY = Math.min(start.y, end.y) - 50
  return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`
}

export default function WorldMapBg() {
  const { theme } = useApp()
  const reducedMotion = useReducedMotion()
  // Run the pulse/arc animations only while the hero is near the viewport —
  // scrolled further down the page, the map costs nothing.
  const [nearRef, near] = useNearViewport('120px', false)
  const animate = near && !reducedMotion

  const dark = theme === 'dark'
  const lineColor = dark ? '#22c8e0' : '#0ea5e9'

  return (
    <div ref={nearRef as any} className="worldmap" aria-hidden="true">
      {/* Static picture — no JS load gating, always visible, zero runtime cost */}
      <img
        src={dark ? '/map-dark.svg' : '/map-light.svg'}
        className="worldmap__img"
        alt=""
        width="1056"
        height="495"
        decoding="async"
        draggable={false}
      />
      <svg viewBox="0 0 800 400" className="worldmap__overlay">
        <defs>
          <linearGradient id="wm-line" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0" />
            <stop offset="12%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="88%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {ROUTES.map((route, i) => {
          const start = projectPoint(route.start.lat, route.start.lng)
          const end = projectPoint(route.end.lat, route.end.lng)
          const d = createCurvedPath(start, end)
          return (
            <g key={`route-${i}`}>
              {/* Faint full arc */}
              <path d={d} fill="none" stroke={lineColor} strokeOpacity="0.22" strokeWidth="0.8" />
              {/* Travelling light pulse */}
              {animate && (
                <path
                  d={d}
                  fill="none"
                  stroke="url(#wm-line)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  pathLength="1"
                  className="worldmap__pulse"
                  style={{ '--dur': `${3.2 + i * 0.4}s`, '--delay': `${-i * 0.9}s` } as React.CSSProperties}
                />
              )}
            </g>
          )
        })}

        {ROUTES.map((route, i) => (
          <g key={`lights-${i}`}>
            {[route.start, route.end].map((p, j) => {
              const { x, y } = projectPoint(p.lat, p.lng)
              return (
                <g key={j}>
                  <circle cx={x} cy={y} r="2" fill={lineColor} />
                  {animate && (
                    <circle cx={x} cy={y} r="2" fill={lineColor} opacity="0.5">
                      <animate attributeName="r" from="2" to="8" dur="1.5s" begin="0s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" begin="0s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>
              )
            })}
          </g>
        ))}
      </svg>
    </div>
  )
}
