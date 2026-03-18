import React from "react"
import { CanvasDisplacementRenderer, shaderPrograms } from "./shader-engine"
import { DEFAULT_MAP, RADIAL_MAP, INTENSE_MAP } from "./displacement-maps"
import type { DisplacementMode } from "./types"

// Produce a computed displacement texture on demand
const buildComputedDisplacement = (w: number, h: number): string => {
  const renderer = new CanvasDisplacementRenderer({
    width: w,
    height: h,
    fragment: shaderPrograms.refraction,
  })
  const uri = renderer.render()
  renderer.dispose()
  return uri
}

export const resolveDisplacementSource = (
  variant: DisplacementMode,
  computedUri?: string,
) => {
  switch (variant) {
    case "standard":
      return DEFAULT_MAP
    case "polar":
      return RADIAL_MAP
    case "prominent":
      return INTENSE_MAP
    case "shader":
      return computedUri || DEFAULT_MAP
    default:
      throw new Error(`Unrecognised displacement variant: ${variant}`)
  }
}

/* ---------- SVG refraction filter ---------- */
export const RefractionFilter: React.FC<{
  id: string
  intensity: number
  aberration: number
  width: number
  height: number
  variant: DisplacementMode
  computedUri?: string
}> = ({ id, intensity, aberration, width, height, variant, computedUri }) => (
  <svg style={{ position: "absolute", width, height }} aria-hidden="true">
    <defs>
      <radialGradient id={`${id}-edge-mask`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="black" stopOpacity="0" />
        <stop offset={`${Math.max(30, 80 - aberration * 2)}%`} stopColor="black" stopOpacity="0" />
        <stop offset="100%" stopColor="white" stopOpacity="1" />
      </radialGradient>
      <filter id={id} x="-35%" y="-35%" width="170%" height="170%" colorInterpolationFilters="sRGB">
        <feImage id="feimage" x="0" y="0" width="100%" height="100%" result="DISP_SRC" href={resolveDisplacementSource(variant, computedUri)} preserveAspectRatio="xMidYMid slice" />

        {/* Derive edge-intensity mask from displacement texture */}
        <feColorMatrix
          in="DISP_SRC"
          type="matrix"
          values="0.3 0.3 0.3 0 0
                 0.3 0.3 0.3 0 0
                 0.3 0.3 0.3 0 0
                 0 0 0 1 0"
          result="EDGE_LUM"
        />
        <feComponentTransfer in="EDGE_LUM" result="EDGE_ALPHA">
          <feFuncA type="discrete" tableValues={`0 ${aberration * 0.05} 1`} />
        </feComponentTransfer>

        {/* Centre pass-through */}
        <feOffset in="SourceGraphic" dx="0" dy="0" result="CENTRE_ORIG" />

        {/* Per-channel displacement for chromatic split */}
        <feDisplacementMap in="SourceGraphic" in2="DISP_SRC" scale={intensity * (variant === "shader" ? 1 : -1)} xChannelSelector="R" yChannelSelector="B" result="CH_R_DISP" />
        <feColorMatrix
          in="CH_R_DISP"
          type="matrix"
          values="1 0 0 0 0
                 0 0 0 0 0
                 0 0 0 0 0
                 0 0 0 1 0"
          result="CH_R"
        />

        <feDisplacementMap in="SourceGraphic" in2="DISP_SRC" scale={intensity * ((variant === "shader" ? 1 : -1) - aberration * 0.05)} xChannelSelector="R" yChannelSelector="B" result="CH_G_DISP" />
        <feColorMatrix
          in="CH_G_DISP"
          type="matrix"
          values="0 0 0 0 0
                 0 1 0 0 0
                 0 0 0 0 0
                 0 0 0 1 0"
          result="CH_G"
        />

        <feDisplacementMap in="SourceGraphic" in2="DISP_SRC" scale={intensity * ((variant === "shader" ? 1 : -1) - aberration * 0.1)} xChannelSelector="R" yChannelSelector="B" result="CH_B_DISP" />
        <feColorMatrix
          in="CH_B_DISP"
          type="matrix"
          values="0 0 0 0 0
                 0 0 0 0 0
                 0 0 1 0 0
                 0 0 0 1 0"
          result="CH_B"
        />

        {/* Recombine channels via screen blending */}
        <feBlend in="CH_G" in2="CH_B" mode="screen" result="GB_MIX" />
        <feBlend in="CH_R" in2="GB_MIX" mode="screen" result="RGB_MIX" />

        {/* Soften chromatic fringe */}
        <feGaussianBlur in="RGB_MIX" stdDeviation={Math.max(0.1, 0.5 - aberration * 0.1)} result="SOFT_ABERR" />

        {/* Mask: aberration on edges only */}
        <feComposite in="SOFT_ABERR" in2="EDGE_ALPHA" operator="in" result="EDGE_ONLY" />

        {/* Inverse mask for clean centre */}
        <feComponentTransfer in="EDGE_ALPHA" result="INV_ALPHA">
          <feFuncA type="table" tableValues="1 0" />
        </feComponentTransfer>
        <feComposite in="CENTRE_ORIG" in2="INV_ALPHA" operator="in" result="CENTRE_CLEAN" />

        {/* Final composite */}
        <feComposite in="EDGE_ONLY" in2="CENTRE_CLEAN" operator="over" />
      </filter>
    </defs>
  </svg>
)

export { buildComputedDisplacement }
