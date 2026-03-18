import { useCallback, useEffect, useRef, useState } from "react"
import FrostedSurface from "./glass-surface"
import {
  computeElasticDeformation,
  computeSpringOffset,
  getProximityIntensity,
} from "./interaction-physics"
import type { GlassLayerConfig, Point2D, DisplacementMode } from "./types"

export type { GlassLayerConfig, Point2D, DisplacementMode }

export default function GlassLayer({
  children,
  displacementScale = 70,
  blurAmount = 0.0625,
  saturation = 140,
  aberrationIntensity = 2,
  elasticity = 0.15,
  cornerRadius = 999,
  globalMousePos: externalCursor,
  mouseOffset: externalOffset,
  mouseContainer = null,
  className = "",
  padding = "24px 32px",
  overLight = false,
  style = {},
  mode = "standard",
  onClick,
}: GlassLayerConfig) {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 270, height: 69 })
  const [localCursor, setLocalCursor] = useState<Point2D>({ x: 0, y: 0 })
  const [localOffset, setLocalOffset] = useState<Point2D>({ x: 0, y: 0 })

  // Decide source of cursor data
  const cursor = externalCursor || localCursor
  const offset = externalOffset || localOffset

  // Internal pointer tracking
  const onPointerMove = useCallback(
    (e: MouseEvent) => {
      const target = mouseContainer?.current || surfaceRef.current
      if (!target) return

      const rect = target.getBoundingClientRect()
      const mx = rect.left + rect.width / 2
      const my = rect.top + rect.height / 2

      setLocalOffset({
        x: ((e.clientX - mx) / rect.width) * 100,
        y: ((e.clientY - my) / rect.height) * 100,
      })

      setLocalCursor({ x: e.clientX, y: e.clientY })
    },
    [mouseContainer],
  )

  // Wire up internal tracking when no external source is provided
  useEffect(() => {
    if (externalCursor && externalOffset) return

    const target = mouseContainer?.current || surfaceRef.current
    if (!target) return

    target.addEventListener("mousemove", onPointerMove)
    return () => target.removeEventListener("mousemove", onPointerMove)
  }, [onPointerMove, mouseContainer, externalCursor, externalOffset])

  // Keep dimensions in sync
  useEffect(() => {
    const measure = () => {
      if (surfaceRef.current) {
        const r = surfaceRef.current.getBoundingClientRect()
        setDimensions({ width: r.width, height: r.height })
      }
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  // Physics calculations
  const intensity = getProximityIntensity(cursor, surfaceRef, dimensions)
  const spring = computeSpringOffset(cursor, surfaceRef, elasticity, intensity)
  const deformation =
    pressed && Boolean(onClick)
      ? "scale(0.96)"
      : computeElasticDeformation(cursor, surfaceRef, dimensions, elasticity)

  const transformCSS = `translate(calc(-50% + ${spring.x}px), calc(-50% + ${spring.y}px)) ${deformation}`

  const baseStyle = {
    ...style,
    transform: transformCSS,
    transition: "all ease-out 0.2s",
  }

  const anchor = {
    position: baseStyle.position || "relative",
    top: baseStyle.top || "50%",
    left: baseStyle.left || "50%",
  }

  return (
    <>
      {/* Dimming overlay for bright mode */}
      <div
        className={`bg-black transition-all duration-150 ease-in-out pointer-events-none ${overLight ? "opacity-20" : "opacity-0"}`}
        style={{
          ...anchor,
          height: dimensions.height,
          width: dimensions.width,
          borderRadius: `${cornerRadius}px`,
          transform: baseStyle.transform,
          transition: baseStyle.transition,
        }}
      />
      <div
        className={`bg-black transition-all duration-150 ease-in-out pointer-events-none mix-blend-overlay ${overLight ? "opacity-100" : "opacity-0"}`}
        style={{
          ...anchor,
          height: dimensions.height,
          width: dimensions.width,
          borderRadius: `${cornerRadius}px`,
          transform: baseStyle.transform,
          transition: baseStyle.transition,
        }}
      />

      {/* Main glass surface */}
      <FrostedSurface
        ref={surfaceRef}
        className={className}
        style={baseStyle}
        radius={cornerRadius}
        intensity={overLight ? displacementScale * 0.5 : displacementScale}
        blurStrength={blurAmount}
        colorBoost={saturation}
        aberration={aberrationIntensity}
        dimensions={dimensions}
        innerPadding={padding}
        mouseOffset={offset}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        pressed={pressed}
        brightOverlay={overLight}
        onClick={onClick}
        variant={mode}
      >
        {children}
      </FrostedSurface>

      {/* Border shimmer layer 1 — screen blend */}
      <span
        style={{
          ...anchor,
          height: dimensions.height,
          width: dimensions.width,
          borderRadius: `${cornerRadius}px`,
          transform: baseStyle.transform,
          transition: baseStyle.transition,
          pointerEvents: "none",
          mixBlendMode: "screen",
          opacity: 0.2,
          padding: "1.5px",
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          boxShadow: "0 0 0 0.5px rgba(255, 255, 255, 0.5) inset, 0 1px 3px rgba(255, 255, 255, 0.25) inset, 0 1px 4px rgba(0, 0, 0, 0.35)",
          background: `linear-gradient(
          ${135 + offset.x * 1.2}deg,
          rgba(255, 255, 255, 0.0) 0%,
          rgba(255, 255, 255, ${0.12 + Math.abs(offset.x) * 0.008}) ${Math.max(10, 33 + offset.y * 0.3)}%,
          rgba(255, 255, 255, ${0.4 + Math.abs(offset.x) * 0.012}) ${Math.min(90, 66 + offset.y * 0.4)}%,
          rgba(255, 255, 255, 0.0) 100%
        )`,
        }}
      />

      {/* Border shimmer layer 2 — overlay blend */}
      <span
        style={{
          ...anchor,
          height: dimensions.height,
          width: dimensions.width,
          borderRadius: `${cornerRadius}px`,
          transform: baseStyle.transform,
          transition: baseStyle.transition,
          pointerEvents: "none",
          mixBlendMode: "overlay",
          padding: "1.5px",
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          boxShadow: "0 0 0 0.5px rgba(255, 255, 255, 0.5) inset, 0 1px 3px rgba(255, 255, 255, 0.25) inset, 0 1px 4px rgba(0, 0, 0, 0.35)",
          background: `linear-gradient(
          ${135 + offset.x * 1.2}deg,
          rgba(255, 255, 255, 0.0) 0%,
          rgba(255, 255, 255, ${0.32 + Math.abs(offset.x) * 0.008}) ${Math.max(10, 33 + offset.y * 0.3)}%,
          rgba(255, 255, 255, ${0.6 + Math.abs(offset.x) * 0.012}) ${Math.min(90, 66 + offset.y * 0.4)}%,
          rgba(255, 255, 255, 0.0) 100%
        )`,
        }}
      />

      {/* Interactive hover / active highlights */}
      {Boolean(onClick) && (
        <>
          <div
            style={{
              ...anchor,
              height: dimensions.height,
              width: dimensions.width + 1,
              borderRadius: `${cornerRadius}px`,
              transform: baseStyle.transform,
              pointerEvents: "none",
              transition: "all 0.2s ease-out",
              opacity: hovered || pressed ? 0.5 : 0,
              backgroundImage: "radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 50%)",
              mixBlendMode: "overlay",
            }}
          />
          <div
            style={{
              ...anchor,
              height: dimensions.height,
              width: dimensions.width + 1,
              borderRadius: `${cornerRadius}px`,
              transform: baseStyle.transform,
              pointerEvents: "none",
              transition: "all 0.2s ease-out",
              opacity: pressed ? 0.5 : 0,
              backgroundImage: "radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 80%)",
              mixBlendMode: "overlay",
            }}
          />
          <div
            style={{
              ...baseStyle,
              height: dimensions.height,
              width: dimensions.width + 1,
              borderRadius: `${cornerRadius}px`,
              position: baseStyle.position,
              top: baseStyle.top,
              left: baseStyle.left,
              pointerEvents: "none",
              transition: "all 0.2s ease-out",
              opacity: hovered ? 0.4 : pressed ? 0.8 : 0,
              backgroundImage: "radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 100%)",
              mixBlendMode: "overlay",
            }}
          />
        </>
      )}
    </>
  )
}
