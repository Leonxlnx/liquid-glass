# Liquid Glass — Complete Recreation Prompt

Build a **React 19 + TypeScript + Vite** reusable `GlassLayer` component that renders a physically realistic frosted glass surface. Works as a **drop-in on any existing webpage** — refracts whatever content sits behind it in the DOM. No specific background required.

**Demo**: Single centered card containing only `"Liquid Glass"` in white. Nothing else.

---

## Why Previous Attempts Look Fake

Every cheap glass implementation uses `backdrop-filter: blur(20px)` and calls it a day. That produces a milky, flat rectangle — not glass. Real glass has these properties that 99% of implementations miss:

1. **Edge refraction** — thick glass bends light at its edges. The center is clear, the perimeter warps the background. This requires an SVG `feDisplacementMap` filter with a custom displacement texture.
2. **Chromatic aberration** — where refraction happens, RGB channels separate slightly, creating a prismatic rainbow fringe. This requires displacing R, G, B channels at different intensities and recombining with screen blending.
3. **Mouse-reactive shimmer border** — a 1.5px hair-thin border that catches light based on cursor position, using CSS `mask-composite: exclude`.
4. **Spring physics** — the glass subtly follows the cursor and stretches like jelly.

Without #1 and #2, it will always look like a div with blur. Those are non-negotiable.

---

## Critical Implementation: Procedural Displacement Map

The displacement texture MUST be generated procedurally. It encodes how much each pixel should be displaced — edges get high displacement, center stays neutral. This is the code that generates it:

```typescript
// shader-engine.ts
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

// The refraction shader — run per-pixel to generate displacement
const refractionShader = (uv: { x: number; y: number }) => {
  const ix = uv.x - 0.5
  const iy = uv.y - 0.5
  const dist = sdfRoundedRect(ix, iy, 0.3, 0.2, 0.6)
  const disp = hermiteSmooth(0.8, 0, dist - 0.15)
  const factor = hermiteSmooth(0, 1, disp)
  return { x: ix * factor + 0.5, y: iy * factor + 0.5 }
}

// Renders displacement to a canvas, returns data URL for feImage
function buildDisplacementMap(w: number, h: number): string {
  const cvs = document.createElement("canvas")
  cvs.width = w; cvs.height = h
  const ctx = cvs.getContext("2d")!
  const raw: number[] = []
  let peak = 0

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pos = refractionShader({ x: x / w, y: y / h })
      const dx = pos.x * w - x
      const dy = pos.y * h - y
      peak = Math.max(peak, Math.abs(dx), Math.abs(dy))
      raw.push(dx, dy)
    }
  }
  peak = Math.max(peak, 1)

  const imgData = ctx.createImageData(w, h)
  let idx = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = raw[idx++], dy = raw[idx++]
      const edgeFade = Math.min(1, Math.min(x, y, w - x - 1, h - y - 1) / 2)
      const pi = (y * w + x) * 4
      imgData.data[pi]     = Math.max(0, Math.min(255, (dx * edgeFade / peak + 0.5) * 255)) // R = horizontal
      imgData.data[pi + 1] = Math.max(0, Math.min(255, (dy * edgeFade / peak + 0.5) * 255)) // G = vertical
      imgData.data[pi + 2] = imgData.data[pi + 1] // B = same as G
      imgData.data[pi + 3] = 255
    }
  }
  ctx.putImageData(imgData, 0, 0)
  return cvs.toDataURL()
}
```

---

## Critical Implementation: SVG Refraction Filter

This is the 10-stage SVG filter that creates the refraction + chromatic aberration. It MUST be rendered as an inline `<svg>` inside the component, sized to match the glass element:

```tsx
// The displacement map URL comes from buildDisplacementMap() above
// W, H = element pixel dimensions
// intensity = 88 (displacement scale)
// aberration = 1.10

<svg style={{ position: "absolute", width: W, height: H }}>
  <defs>
    <filter id={filterId} x="-35%" y="-35%" width="170%" height="170%" colorInterpolationFilters="sRGB">
      {/* 1. Load displacement texture */}
      <feImage x="0" y="0" width={`${W}px`} height={`${H}px`}
        href={displacementMapUrl} preserveAspectRatio="none" result="DISP_SRC" />

      {/* 2. Convert to luminance for edge mask */}
      <feColorMatrix in="DISP_SRC" type="matrix"
        values="0.3 0.3 0.3 0 0  0.3 0.3 0.3 0 0  0.3 0.3 0.3 0 0  0 0 0 1 0"
        result="EDGE_LUM" />

      {/* 3. Threshold into binary edge alpha */}
      <feComponentTransfer in="EDGE_LUM" result="EDGE_ALPHA">
        <feFuncA type="discrete" tableValues={`0 ${aberration * 0.05} 1`} />
      </feComponentTransfer>

      {/* 4. Clean center pass-through */}
      <feOffset in="SourceGraphic" dx="0" dy="0" result="CENTRE_ORIG" />

      {/* 5-7. PER-CHANNEL displacement — THE key technique */}
      {/* Red channel: scale = intensity * 1 */}
      <feDisplacementMap in="SourceGraphic" in2="DISP_SRC"
        scale={intensity * 1} xChannelSelector="R" yChannelSelector="B" result="CH_R_DISP" />
      <feColorMatrix in="CH_R_DISP" type="matrix"
        values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="CH_R" />

      {/* Green channel: slightly MORE displaced */}
      <feDisplacementMap in="SourceGraphic" in2="DISP_SRC"
        scale={intensity * (1 - aberration * 0.05)} xChannelSelector="R" yChannelSelector="B" result="CH_G_DISP" />
      <feColorMatrix in="CH_G_DISP" type="matrix"
        values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="CH_G" />

      {/* Blue channel: MOST displaced */}
      <feDisplacementMap in="SourceGraphic" in2="DISP_SRC"
        scale={intensity * (1 - aberration * 0.1)} xChannelSelector="R" yChannelSelector="B" result="CH_B_DISP" />
      <feColorMatrix in="CH_B_DISP" type="matrix"
        values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="CH_B" />

      {/* 8. Recombine via screen blend → prismatic RGB split */}
      <feBlend in="CH_G" in2="CH_B" mode="screen" result="GB_MIX" />
      <feBlend in="CH_R" in2="GB_MIX" mode="screen" result="RGB_MIX" />

      {/* 9. Soften chromatic fringe */}
      <feGaussianBlur in="RGB_MIX" stdDeviation={Math.max(0.1, 0.5 - aberration * 0.1)} result="SOFT_ABERR" />

      {/* 10. Composite: aberration on edges only, clean center underneath */}
      <feComposite in="SOFT_ABERR" in2="EDGE_ALPHA" operator="in" result="EDGE_ONLY" />
      <feComponentTransfer in="EDGE_ALPHA" result="INV_ALPHA">
        <feFuncA type="table" tableValues="1 0" />
      </feComponentTransfer>
      <feComposite in="CENTRE_ORIG" in2="INV_ALPHA" operator="in" result="CENTRE_CLEAN" />
      <feComposite in="EDGE_ONLY" in2="CENTRE_CLEAN" operator="over" />
    </filter>
  </defs>
</svg>
```

---

## Critical Implementation: Frosted Surface

The glass surface div applies BOTH `backdrop-filter` AND the SVG filter:

```tsx
<div style={{ overflow: "hidden", borderRadius: "0px", padding: "40px 56px",
  boxShadow: "0px 12px 40px rgba(0,0,0,0.25)" }}>
  {/* Warp layer — carries both filters */}
  <span style={{
    position: "absolute", inset: 0,
    backdropFilter: `blur(${0.025 * 32}px) saturate(121%)`,        // 0.8px blur + color boost
    WebkitBackdropFilter: `blur(${0.025 * 32}px) saturate(121%)`,
    filter: `url(#${filterId})`,                                    // SVG displacement
  }} />
  {/* Content above */}
  <div style={{ position: "relative", zIndex: 1, color: "white",
    textShadow: "0px 2px 12px rgba(0,0,0,0.4)" }}>
    {children}
  </div>
</div>
```

---

## Critical Implementation: Shimmer Border

Two `<span>` siblings using **CSS mask-composite** to render a gradient ONLY in a 1.5px border ring:

```tsx
// Both spans share this mask trick:
const borderMask = {
  padding: "1.5px",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  maskComposite: "exclude",
  boxShadow: "0 0 0 0.5px rgba(255,255,255,0.5) inset, 0 1px 3px rgba(255,255,255,0.25) inset, 0 1px 4px rgba(0,0,0,0.35)",
}

// Span 1: mix-blend-mode: screen, opacity: 0.2
// Span 2: mix-blend-mode: overlay (stronger opacities: 0.32 / 0.6)
// Both use this mouse-reactive gradient (offset = normalized cursor position):
background: `linear-gradient(
  ${135 + offset.x * 1.2}deg,
  rgba(255,255,255,0) 0%,
  rgba(255,255,255,${0.12 + Math.abs(offset.x) * 0.008}) ${Math.max(10, 33 + offset.y * 0.3)}%,
  rgba(255,255,255,${0.4 + Math.abs(offset.x) * 0.012}) ${Math.min(90, 66 + offset.y * 0.4)}%,
  rgba(255,255,255,0) 100%
)`
```

---

## Interaction Physics

```typescript
const PROXIMITY_RANGE = 200

function getProximityIntensity(cursor, element, dimensions) {
  const rect = element.getBoundingClientRect()
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2
  const gapX = Math.max(0, Math.abs(cursor.x - cx) - dimensions.width / 2)
  const gapY = Math.max(0, Math.abs(cursor.y - cy) - dimensions.height / 2)
  const edgeDist = Math.sqrt(gapX ** 2 + gapY ** 2)
  return edgeDist > PROXIMITY_RANGE ? 0 : 1 - edgeDist / PROXIMITY_RANGE
}

// Spring translation (elasticity = 0.04):
springX = (cursor.x - centerX) * 0.04 * 0.1 * intensity  // ~2-3px max
springY = (cursor.y - centerY) * 0.04 * 0.1 * intensity

// Elastic jelly deformation:
pull = Math.min(centerDist / 300, 1) * 0.04 * proximity
scaleX = Math.max(0.8, 1 + |nx| * pull * 0.3 - |ny| * pull * 0.15)
scaleY = Math.max(0.8, 1 + |ny| * pull * 0.3 - |nx| * pull * 0.15)

// Press: scale(0.96) on mousedown
// All transitions: "all 0.2s ease-out"
```

---

## Architecture

The component renders a **React Fragment** with siblings (NOT wrapped in a div):
1. FrostedSurface (glass div + warp span + inline SVG filter)
2. Shimmer span 1 (screen blend border)
3. Shimmer span 2 (overlay blend border)
4. Hover/press glow overlays (if onClick provided)

All siblings share `position: fixed; top: 50%; left: 50%` with the spring transform. Position via `style` prop.

**Cross-browser**: SVG displacement only works on Chromium. For Safari/Firefox, fall back to a CSS `conic-gradient` shimmer (3 HSL stops 120° apart, edge-masked with radial-gradient, blurred 7px, `mix-blend-mode: screen`).

---

## Values for Sharp Rectangular Variant

| Parameter | Value |
|---|---|
| `displacementScale` | `88` |
| `blurAmount` | `0.025` (= 0.8px actual blur) |
| `saturation` | `121%` |
| `aberrationIntensity` | `1.10` |
| `elasticity` | `0.04` |
| `cornerRadius` | `0px` |
| `padding` | `"40px 56px"` |

```tsx
<GlassLayer
  displacementScale={88}
  blurAmount={0.025}
  saturation={121}
  aberrationIntensity={1.10}
  elasticity={0.04}
  cornerRadius={0}
  padding="40px 56px"
  style={{ position: 'fixed', top: '50%', left: '50%' }}
>
  <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: 'white' }}>
    Liquid Glass
  </h1>
</GlassLayer>
```
