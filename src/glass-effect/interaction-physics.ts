import type { Point2D } from "./types"

/** Pixels from the element edge at which the effect begins to engage */
const PROXIMITY_RANGE = 200
/** Maximum normalised influence of mouse distance on stretch */
const MAX_PULL = 1

/**
 * Compute a directional elastic deformation matrix (CSS scaleX/scaleY)
 * based on the cursor position relative to the element.
 */
export function computeElasticDeformation(
  cursor: Point2D,
  elementRef: React.RefObject<HTMLDivElement | null>,
  dimensions: { width: number; height: number },
  springFactor: number,
): string {
  if (!cursor.x || !cursor.y || !elementRef.current) return "scale(1)"

  const rect = elementRef.current.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2

  const dx = cursor.x - cx
  const dy = cursor.y - cy

  // Distance from outermost edges of the element (not centre)
  const gapX = Math.max(0, Math.abs(dx) - dimensions.width / 2)
  const gapY = Math.max(0, Math.abs(dy) - dimensions.height / 2)
  const edgeDist = Math.sqrt(gapX * gapX + gapY * gapY)

  if (edgeDist > PROXIMITY_RANGE) return "scale(1)"

  const proximity = 1 - edgeDist / PROXIMITY_RANGE
  const centreDist = Math.sqrt(dx * dx + dy * dy)
  if (centreDist === 0) return "scale(1)"

  const nx = dx / centreDist
  const ny = dy / centreDist

  const pull = Math.min(centreDist / 300, MAX_PULL) * springFactor * proximity

  const sx = 1 + Math.abs(nx) * pull * 0.3 - Math.abs(ny) * pull * 0.15
  const sy = 1 + Math.abs(ny) * pull * 0.3 - Math.abs(nx) * pull * 0.15

  return `scaleX(${Math.max(0.8, sx)}) scaleY(${Math.max(0.8, sy)})`
}

/**
 * Returns a 0-1 intensity value depending on how close the cursor
 * is to the element edge (1 = touching, 0 = outside range).
 */
export function getProximityIntensity(
  cursor: Point2D,
  elementRef: React.RefObject<HTMLDivElement | null>,
  dimensions: { width: number; height: number },
): number {
  if (!cursor.x || !cursor.y || !elementRef.current) return 0

  const rect = elementRef.current.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2

  const gapX = Math.max(0, Math.abs(cursor.x - cx) - dimensions.width / 2)
  const gapY = Math.max(0, Math.abs(cursor.y - cy) - dimensions.height / 2)
  const edgeDist = Math.sqrt(gapX * gapX + gapY * gapY)

  return edgeDist > PROXIMITY_RANGE ? 0 : 1 - edgeDist / PROXIMITY_RANGE
}

/**
 * Compute a small translation offset that "pulls" the element towards
 * the cursor with spring-like damping.
 */
export function computeSpringOffset(
  cursor: Point2D,
  elementRef: React.RefObject<HTMLDivElement | null>,
  springFactor: number,
  intensity: number,
): Point2D {
  if (!elementRef.current) return { x: 0, y: 0 }

  const rect = elementRef.current.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2

  return {
    x: (cursor.x - cx) * springFactor * 0.1 * intensity,
    y: (cursor.y - cy) * springFactor * 0.1 * intensity,
  }
}
