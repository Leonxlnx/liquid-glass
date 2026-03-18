import type { Point2D, DisplacementConfig } from "./types"

function hermiteSmooth(edge0: number, edge1: number, t: number): number {
  t = Math.max(0, Math.min(1, (t - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function magnitude(x: number, y: number): number {
  return Math.sqrt(x * x + y * y)
}

function sdfRoundedRect(x: number, y: number, w: number, h: number, r: number): number {
  const qx = Math.abs(x) - w + r
  const qy = Math.abs(y) - h + r
  return Math.min(Math.max(qx, qy), 0) + magnitude(Math.max(qx, 0), Math.max(qy, 0)) - r
}

function mapCoord(x: number, y: number): Point2D {
  return { x, y }
}

export const shaderPrograms = {
  refraction: (uv: Point2D): Point2D => {
    const ix = uv.x - 0.5
    const iy = uv.y - 0.5
    const dist = sdfRoundedRect(ix, iy, 0.3, 0.2, 0.6)
    const disp = hermiteSmooth(0.8, 0, dist - 0.15)
    const factor = hermiteSmooth(0, 1, disp)
    return mapCoord(ix * factor + 0.5, iy * factor + 0.5)
  },
}

export class CanvasDisplacementRenderer {
  cvs: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  dpiScale = 1
  cfg: DisplacementConfig

  constructor(cfg: DisplacementConfig) {
    this.cfg = cfg
    this.cvs = document.createElement("canvas")
    this.cvs.width = cfg.width * this.dpiScale
    this.cvs.height = cfg.height * this.dpiScale
    this.cvs.style.display = "none"

    const ctx = this.cvs.getContext("2d")
    if (!ctx) throw new Error("Failed to acquire 2D rendering context")
    this.ctx = ctx
  }

  render(cursor?: Point2D): string {
    const w = this.cfg.width * this.dpiScale
    const h = this.cfg.height * this.dpiScale

    let peak = 0
    const raw: number[] = []

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const uv: Point2D = { x: x / w, y: y / h }
        const pos = this.cfg.fragment(uv, cursor)
        const dx = pos.x * w - x
        const dy = pos.y * h - y
        peak = Math.max(peak, Math.abs(dx), Math.abs(dy))
        raw.push(dx, dy)
      }
    }

    if (peak > 0) {
      peak = Math.max(peak, 1)
    } else {
      peak = 1
    }

    const imgData = this.ctx.createImageData(w, h)
    const pixels = imgData.data
    let idx = 0

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = raw[idx++]
        const dy = raw[idx++]

        const edgeDist = Math.min(x, y, w - x - 1, h - y - 1)
        const edgeFade = Math.min(1, edgeDist / 2)

        const sx = dx * edgeFade
        const sy = dy * edgeFade

        const rNorm = sx / peak + 0.5
        const gNorm = sy / peak + 0.5

        const pi = (y * w + x) * 4
        pixels[pi] = Math.max(0, Math.min(255, rNorm * 255))
        pixels[pi + 1] = Math.max(0, Math.min(255, gNorm * 255))
        pixels[pi + 2] = Math.max(0, Math.min(255, gNorm * 255))
        pixels[pi + 3] = 255
      }
    }

    this.ctx.putImageData(imgData, 0, 0)
    return this.cvs.toDataURL()
  }

  dispose(): void {
    this.cvs.remove()
  }

  getResolutionScale(): number {
    return this.dpiScale
  }
}
