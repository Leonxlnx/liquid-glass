import React, { useMemo } from "react"

/**
 * CSS-only refraction shimmer for non-Chromium browsers.
 *
 * Uses layered conic + radial gradients that shift with mouse offset
 * to approximate the edge light-bending look of the SVG displacement filter.
 */
export const ShimmerOverlay: React.FC<{
  width: number
  height: number
  mouseOffset?: { x: number; y: number }
  aberration?: number
  radius?: number
}> = ({ width, height, mouseOffset = { x: 0, y: 0 }, aberration = 2, radius = 20 }) => {
  // Normalised cursor offset in [-1, 1] range
  const nx = width > 0 ? (mouseOffset.x / width) * 2 : 0
  const ny = height > 0 ? (mouseOffset.y / height) * 2 : 0

  const style = useMemo<React.CSSProperties>(() => {
    const angle = Math.atan2(ny, nx) * (180 / Math.PI) + 180
    const strength = Math.min(1, Math.sqrt(nx * nx + ny * ny))
    const opacity = 0.12 + strength * 0.18 + aberration * 0.02

    // Chromatic fringe colours shift with cursor position
    const hue1 = (angle + 0) % 360
    const hue2 = (angle + 120) % 360
    const hue3 = (angle + 240) % 360

    // Edge-only radial mask — transparent centre, coloured edges
    const edgeStart = `${Math.max(35, 65 - aberration * 4)}%`

    return {
      position: "absolute" as const,
      inset: 0,
      borderRadius: `${radius}px`,
      pointerEvents: "none" as const,
      mixBlendMode: "screen" as const,
      opacity,
      transition: "opacity 0.3s ease",
      background: [
        // Chromatic fringe ring
        `conic-gradient(from ${angle}deg at ${50 + nx * 8}% ${50 + ny * 8}%,
          hsla(${hue1}, 100%, 75%, 0.6),
          hsla(${hue2}, 100%, 75%, 0.6),
          hsla(${hue3}, 100%, 75%, 0.6),
          hsla(${hue1}, 100%, 75%, 0.6)
        )`,
        // Edge mask — keep centre transparent
        `radial-gradient(ellipse at ${50 + nx * 10}% ${50 + ny * 10}%,
          transparent ${edgeStart},
          rgba(255,255,255,0.15) 100%
        )`,
      ].join(", "),
      backgroundBlendMode: "multiply",
      // Subtle shimmer animation
      filter: `blur(${6 + aberration}px)`,
    }
  }, [nx, ny, aberration, radius, width, height])

  return <div className="shimmer-refraction" style={style} />
}

export default ShimmerOverlay
