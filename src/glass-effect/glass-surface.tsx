import { type CSSProperties, forwardRef, useEffect, useId, useState } from "react"
import { RefractionFilter, buildComputedDisplacement } from "./svg-filter"
import type { DisplacementMode } from "./types"

/* ---------- Frosted glass surface ---------- */
const FrostedSurface = forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<{
    className?: string
    style?: React.CSSProperties
    intensity?: number
    blurStrength?: number
    colorBoost?: number
    aberration?: number
    mouseOffset?: { x: number; y: number }
    onMouseLeave?: () => void
    onMouseEnter?: () => void
    onMouseDown?: () => void
    onMouseUp?: () => void
    pressed?: boolean
    brightOverlay?: boolean
    radius?: number
    innerPadding?: string
    dimensions?: { width: number; height: number }
    onClick?: () => void
    variant?: DisplacementMode
  }>
>(
  (
    {
      children,
      className = "",
      style,
      intensity = 25,
      blurStrength = 12,
      colorBoost = 180,
      aberration = 2,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      pressed = false,
      brightOverlay = false,
      radius = 999,
      innerPadding = "24px 32px",
      dimensions = { width: 270, height: 69 },
      onClick,
      variant = "standard",
    },
    ref,
  ) => {
    const filterTag = useId()
    const [computedUri, setComputedUri] = useState<string>("")

    const isGecko = navigator.userAgent.toLowerCase().includes("firefox")

    // Build shader-based map on demand
    useEffect(() => {
      if (variant === "shader") {
        const uri = buildComputedDisplacement(dimensions.width, dimensions.height)
        setComputedUri(uri)
      }
    }, [variant, dimensions.width, dimensions.height])

    const backdropCSS = {
      filter: isGecko ? null : `url(#${filterTag})`,
      backdropFilter: `blur(${(brightOverlay ? 12 : 0) + blurStrength * 32}px) saturate(${colorBoost}%)`,
    }

    return (
      <div ref={ref} className={`relative ${className} ${pressed ? "active" : ""} ${Boolean(onClick) ? "cursor-pointer" : ""}`} style={style} onClick={onClick}>
        <RefractionFilter
          variant={variant}
          id={filterTag}
          intensity={intensity}
          aberration={aberration}
          width={dimensions.width}
          height={dimensions.height}
          computedUri={computedUri}
        />

        <div
          className="frost-layer"
          style={{
            borderRadius: `${radius}px`,
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            gap: "24px",
            padding: innerPadding,
            overflow: "hidden",
            transition: "all 0.2s ease-in-out",
            boxShadow: brightOverlay ? "0px 16px 70px rgba(0, 0, 0, 0.75)" : "0px 12px 40px rgba(0, 0, 0, 0.25)",
          }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
        >
          {/* Backdrop warp layer */}
          <span
            className="frost-layer__warp"
            style={
              {
                ...backdropCSS,
                position: "absolute",
                inset: "0",
              } as CSSProperties
            }
          />

          {/* Crisp content layer */}
          <div
            className="transition-all duration-150 ease-in-out text-white"
            style={{
              position: "relative",
              zIndex: 1,
              font: "500 20px/1 system-ui",
              textShadow: brightOverlay ? "0px 2px 12px rgba(0, 0, 0, 0)" : "0px 2px 12px rgba(0, 0, 0, 0.4)",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    )
  },
)

FrostedSurface.displayName = "FrostedSurface"

export default FrostedSurface
