import type { CSSProperties, RefObject } from "react"

export interface Point2D {
  x: number
  y: number
}

export type DisplacementMode = "standard" | "polar" | "prominent" | "shader"

export interface DisplacementConfig {
  width: number
  height: number
  fragment: (uv: Point2D, cursor?: Point2D) => Point2D
  cursorPosition?: Point2D
}

export interface SurfaceDimensions {
  width: number
  height: number
}

export interface GlassLayerConfig {
  children: React.ReactNode
  displacementScale?: number
  blurAmount?: number
  saturation?: number
  aberrationIntensity?: number
  elasticity?: number
  cornerRadius?: number
  globalMousePos?: Point2D
  mouseOffset?: Point2D
  mouseContainer?: RefObject<HTMLElement | null> | null
  className?: string
  padding?: string
  style?: CSSProperties
  overLight?: boolean
  mode?: DisplacementMode
  onClick?: () => void
}

export interface FrostedSurfaceProps {
  children?: React.ReactNode
  className?: string
  style?: CSSProperties
  displacementScale?: number
  blurAmount?: number
  saturation?: number
  aberrationIntensity?: number
  mouseOffset?: Point2D
  onMouseLeave?: () => void
  onMouseEnter?: () => void
  onMouseDown?: () => void
  onMouseUp?: () => void
  active?: boolean
  overLight?: boolean
  cornerRadius?: number
  padding?: string
  glassSize?: SurfaceDimensions
  onClick?: () => void
  mode?: DisplacementMode
}

export interface RefractionFilterProps {
  id: string
  displacementScale: number
  aberrationIntensity: number
  width: number
  height: number
  mode: DisplacementMode
  computedMapUrl?: string
}
