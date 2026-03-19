# Liquid Glass Effect — Complete Recreation Prompt

> Use this prompt to recreate the exact frosted glass UI component from scratch. It describes every architectural layer, every algorithm, every CSS trick, and every SVG filter primitive in precise technical detail.

---

## Prompt

Build a **React 19 + TypeScript + Vite** project that renders a single centered frosted glass card on top of a full-viewport background image. The card displays a title ("Liquid Glass") and subtitle ("Scroll through the backgrounds") in white text. The glass effect must be physically realistic — not a simple `backdrop-filter: blur()` — but a multi-layered optical simulation combining **SVG displacement maps**, **per-channel chromatic aberration**, **spring physics**, **elastic deformation**, and **dynamic shimmer borders**.

### Project Structure

Create 8 files inside `src/glass-effect/`:

```
src/glass-effect/
├── index.tsx              → GlassLayer (main orchestrator)
├── glass-surface.tsx      → FrostedSurface (backdrop-filter + SVG filter host)
├── svg-filter.tsx         → RefractionFilter (SVG filter definition)
├── shader-engine.ts       → CanvasDisplacementRenderer (procedural map generator)
├── displacement-maps.ts   → 3 pre-baked base64 displacement textures
├── interaction-physics.ts → Spring offset, elastic deformation, proximity detection
├── browser-detect.ts      → Chromium / WebKit / Gecko detection
├── shimmer-overlay.tsx    → CSS-only fallback for non-Chromium browsers
└── types.ts               → TypeScript interfaces
```

Plus a simple `App.tsx` that uses `GlassLayer` and `index.css` for global resets.

---

### Layer 1: SVG Displacement Filter (`svg-filter.tsx`)

This is the core optical engine. Render an inline `<svg>` with `position: absolute` sized to the element dimensions. Inside `<defs>`, define a `<filter>` with `x="-35%" y="-35%" width="170%" height="170%"` and `colorInterpolationFilters="sRGB"`.

The filter pipeline has **10 stages**:

1. **`<feImage>`** — Load a displacement texture (base64 JPEG data URI) at exact pixel dimensions (`width={w}px`, `height={h}px`) with `preserveAspectRatio="none"`. Output: `DISP_SRC`. For Firefox compatibility, convert `data:` URIs to `blob:` URLs via `fetch().then(res => res.blob()).then(blob => URL.createObjectURL(blob))`.

2. **`<feColorMatrix>`** — Convert `DISP_SRC` to luminance using matrix `[0.3 0.3 0.3 0 0 / 0.3 0.3 0.3 0 0 / 0.3 0.3 0.3 0 0 / 0 0 0 1 0]`. Output: `EDGE_LUM`.

3. **`<feComponentTransfer>`** — Threshold the luminance into an edge alpha mask using `<feFuncA type="discrete" tableValues="0 {aberration*0.05} 1">`. Output: `EDGE_ALPHA`. This creates a binary mask: transparent center, opaque edges.

4. **`<feOffset>`** — Pass-through of `SourceGraphic` with `dx=0 dy=0`. Output: `CENTRE_ORIG`.

5. **Red channel displacement** — `<feDisplacementMap in="SourceGraphic" in2="DISP_SRC" scale={intensity * -1} xChannelSelector="R" yChannelSelector="B">`, then isolate red via `<feColorMatrix>` with values `[1 0 0 0 0 / 0 0 0 0 0 / 0 0 0 0 0 / 0 0 0 1 0]`. Output: `CH_R`.

6. **Green channel displacement** — Same but scale is `intensity * (-1 - aberration * 0.05)`. Isolate green with matrix `[0 0 0 0 0 / 0 1 0 0 0 / 0 0 0 0 0 / 0 0 0 1 0]`. Output: `CH_G`.

7. **Blue channel displacement** — Scale is `intensity * (-1 - aberration * 0.1)`. Isolate blue with matrix `[0 0 0 0 0 / 0 0 0 0 0 / 0 0 1 0 0 / 0 0 0 1 0]`. Output: `CH_B`.

8. **Screen-blend recombination** — `<feBlend in="CH_G" in2="CH_B" mode="screen">` → `GB_MIX`, then `<feBlend in="CH_R" in2="GB_MIX" mode="screen">` → `RGB_MIX`.

9. **Soften fringe** — `<feGaussianBlur stdDeviation={max(0.1, 0.5 - aberration * 0.1)}>` on `RGB_MIX`. Output: `SOFT_ABERR`.

10. **Edge-only compositing** — `<feComposite in="SOFT_ABERR" in2="EDGE_ALPHA" operator="in">` → `EDGE_ONLY`. Then invert the alpha mask via `<feComponentTransfer>` with `<feFuncA type="table" tableValues="1 0">` → `INV_ALPHA`. Composite clean center: `<feComposite in="CENTRE_ORIG" in2="INV_ALPHA" operator="in">` → `CENTRE_CLEAN`. Final: `<feComposite in="EDGE_ONLY" in2="CENTRE_CLEAN" operator="over">`.

**Key insight**: The chromatic aberration is achieved by displacing R, G, B channels with **slightly different scales** (offset by `aberration * 0.05` and `aberration * 0.1`), isolating each channel into its own color matrix, and recombining them via screen blending. This creates the rainbow fringe at the edges that makes the glass look like a real lens.

---

### Layer 2: Glass Surface (`glass-surface.tsx`)

A `forwardRef` component that wraps children in a frosted container:

- **Outer div**: `position` from parent style, carries the `ref`, `onClick`, and mouse event handlers. Has classes for `cursor-pointer` when clickable.
- **Frost layer div**: `display: inline-flex`, `align-items: center`, `gap: 24px`, `overflow: hidden`, with dynamic `padding`, `borderRadius`, `boxShadow` (`0px 12px 40px rgba(0,0,0,0.25)` normal, `0px 16px 70px rgba(0,0,0,0.75)` for bright mode), and `transition: all 0.2s ease-in-out`.
- **Warp span** (inside frost layer): `position: absolute`, `inset: 0`. Carries **both**:
  - `filter: url(#filterId)` — the SVG displacement filter (Chromium only)
  - `backdrop-filter: blur({(brightOverlay ? 12 : 0) + blurStrength * 32}px) saturate({colorBoost}%)`
  - Also set `-webkit-backdrop-filter` for Safari
- **Content div**: `position: relative`, `z-index: 1`, `text-shadow: 0px 2px 12px rgba(0,0,0,0.4)`.

For **non-Chromium browsers** (detected via UA sniffing), render a `ShimmerOverlay` instead of relying on the SVG filter.

---

### Layer 3: Shimmer Border System (`index.tsx`)

The orchestrator renders a **React Fragment** (`<>`) containing 6+ sibling elements, all sharing the same `anchor` positioning:

```ts
const anchor = {
  position: baseStyle.position || "relative",
  top: baseStyle.top || "50%",
  left: baseStyle.left || "50%",
}
```

All siblings get `transform: translate(calc(-50% + springX), calc(-50% + springY)) + deformation` and `transition: all ease-out 0.2s`.

**Shimmer border technique** — Two `<span>` elements create the glass edge glow:

Both spans use the **CSS mask-composite trick** to render border-only gradients:
```css
padding: 1.5px;
-webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
-webkit-mask-composite: xor;
mask-composite: exclude;
```
This renders the gradient only in the 1.5px padding area (the border), not the interior.

**Span 1** (screen blend, opacity 0.2):
```
box-shadow: 0 0 0 0.5px rgba(255,255,255,0.5) inset,
            0 1px 3px rgba(255,255,255,0.25) inset,
            0 1px 4px rgba(0,0,0,0.35);
background: linear-gradient(
  {135 + mouseOffset.x * 1.2}deg,
  rgba(255,255,255,0) 0%,
  rgba(255,255,255, {0.12 + |offset.x| * 0.008}) {max(10, 33 + offset.y * 0.3)}%,
  rgba(255,255,255, {0.4 + |offset.x| * 0.012}) {min(90, 66 + offset.y * 0.4)}%,
  rgba(255,255,255,0) 100%
);
```

**Span 2** (overlay blend): Same structure but inner opacity values are `0.32` and `0.6` base instead of `0.12` and `0.4`.

The gradient angle and stop positions **react to the mouse offset**, making the border shimmer follow the cursor.

---

### Layer 4: Spring Physics & Elastic Deformation (`interaction-physics.ts`)

Three exported functions:

**`getProximityIntensity(cursor, elementRef, dimensions)`**: Returns 0–1 based on distance from cursor to element edge. Uses a 200px `PROXIMITY_RANGE`. Calculates gap from nearest edge point (not center), then linearly interpolates: `1 - edgeDist / 200`.

**`computeSpringOffset(cursor, elementRef, springFactor, intensity)`**: Pulls the element toward the cursor: `x = (cursor.x - centerX) * springFactor * 0.1 * intensity`. This creates the subtle "magnetic" follow effect.

**`computeElasticDeformation(cursor, elementRef, dimensions, springFactor)`**: Computes directional stretch. Calculates a `pull` factor from center distance (capped at 1.0), then:
```
scaleX = 1 + |normalizedDx| * pull * 0.3 - |normalizedDy| * pull * 0.15
scaleY = 1 + |normalizedDy| * pull * 0.3 - |normalizedDx| * pull * 0.15
```
Clamped to minimum 0.8. When mouse moves horizontally, element stretches horizontally and compresses vertically (and vice versa), simulating a jelly-like deformation.

When `pressed && onClick`, override with `scale(0.96)` for a tactile press effect.

---

### Layer 5: Procedural Displacement Map (`shader-engine.ts`)

A `CanvasDisplacementRenderer` class that generates displacement textures procedurally:

- Creates an offscreen `<canvas>` at element dimensions
- For each pixel, runs a **fragment function** that returns displaced UV coordinates
- The built-in `refraction` shader:
  1. Centers UV to [-0.5, 0.5]
  2. Computes SDF (Signed Distance Field) of a rounded rectangle: `sdfRoundedRect(ix, iy, 0.3, 0.2, 0.6)`
  3. Applies Hermite smoothstep: `hermiteSmooth(0.8, 0, dist - 0.15)` → creates a smooth falloff from center to edges
  4. Multiplies UV by smoothed factor and re-centers
- The displacement deltas (dx, dy) are normalized to peak range, edge-faded (2px feather), and encoded as R/G channels (0.5 = neutral, >0.5 = positive displacement)
- Output: `canvas.toDataURL()` base64 PNG

---

### Layer 6: Hover & Press Interactive Highlights (`index.tsx`)

Only rendered when `onClick` is provided. Three overlay `<div>` elements:

1. **Hover glow** — `radial-gradient(circle at 50% 0%, rgba(255,255,255,0.5) 0%, transparent 50%)`, `mix-blend-mode: overlay`, opacity 0.5 on hover, 0 otherwise.
2. **Press glow** — Same gradient but extends to 80%, opacity 0.5 on press only.
3. **Combined highlight** — Full `radial-gradient(circle at 50% 0%, white 0%, transparent 100%)`, `mix-blend-mode: overlay`, opacity 0.4 hover / 0.8 pressed.

All three use `transition: all 0.2s ease-out`.

---

### Layer 7: Cross-Browser Fallback (`shimmer-overlay.tsx`)

For Safari and Firefox (where `backdrop-filter` + SVG `filter` don't work together):

A `<div>` with `position: absolute; inset: 0` and `mix-blend-mode: screen`. Uses layered CSS gradients:

1. **Conic gradient** — Rotates with cursor angle (`atan2(ny, nx) * 180/PI + 180`), centered at `50 + nx*8%, 50 + ny*8%`. Three HSL stops 120° apart for chromatic fringe simulation.
2. **Radial gradient** — Edge mask starting at `max(35, 65 - aberration*4)%` to keep center transparent.
3. Combined with `background-blend-mode: multiply`.
4. Blurred with `filter: blur({6 + aberration}px)`.

Dynamic opacity: `0.12 + cursorStrength * 0.18 + aberration * 0.02`.

---

### Layer 8: Browser Detection (`browser-detect.ts`)

- `isChromium()`: Checks `window.chrome` exists and UA doesn't contain "Firefox"
- `isWebKit()`: UA contains "AppleWebKit" but not "Chrome"/"Chromium"
- `isGecko()`: UA contains "Firefox" or "Gecko/"
- `supportsBackdropSvgFilter()`: Returns `true` only on Chromium (the only engine that supports combined SVG filter + backdrop-filter as of 2026)

---

### Layer 9: Displacement Textures (`displacement-maps.ts`)

Export 3 named constants as base64-encoded data URIs:
- `DEFAULT_MAP` — JPEG, standard edge-focused displacement
- `RADIAL_MAP` — JPEG, circular/polar displacement pattern
- `INTENSE_MAP` — PNG, high-contrast aggressive displacement

These are pre-generated textures where R channel = horizontal displacement and G/B channels = vertical displacement. Neutral gray (128) = no displacement. The `resolveDisplacementSource()` function selects between them based on the `mode` prop.

---

### Layer 10: The App (`App.tsx`)

Minimal demo with a single background image covering 100vh and a centered `GlassLayer`:

```tsx
<GlassLayer
  mouseContainer={containerRef}
  displacementScale={50}
  blurAmount={0.05}
  saturation={115}
  aberrationIntensity={1}
  elasticity={0.2}
  cornerRadius={20}
  padding="40px 56px"
  style={{ position: 'fixed', top: '50%', left: '50%' }}
>
  <h1>Liquid Glass</h1>
  <p>Scroll through the backgrounds</p>
</GlassLayer>
```

Note: `position: 'fixed'` with `top: '50%', left: '50%'` is **mandatory** — the internal `translate(-50%, -50%)` transform centers the element. The Fragment-based rendering architecture means the element **cannot** be wrapped in a container div for positioning; it must use fixed/absolute positioning via the `style` prop.

---

### Critical Implementation Notes

1. **Fragment rendering**: `GlassLayer` returns `<>` (Fragment) with 5–8 sibling elements. All share the same `anchor` position. This means the component cannot be positioned via a parent wrapper — the `style.position`, `style.top`, `style.left` are read and applied to every sibling.

2. **Mouse tracking**: Two modes — internal (listener on `mouseContainer.current || surfaceRef.current`) or external (pass `globalMousePos` + `mouseOffset` props). The offset is normalized: `((clientX - centerX) / width) * 100`.

3. **Dimension sync**: A `ResizeObserver`-like pattern via `getBoundingClientRect()` on mount + window resize. The measured dimensions drive the SVG filter sizing, shimmer border sizing, and displacement map generation.

4. **Transition**: Every animated element uses `transition: all ease-out 0.2s`. Spring offset and deformation are computed per-render (no requestAnimationFrame), relying on CSS transitions for smoothing.

5. **Displacement scale semantics**: `displacementScale` controls the `scale` attribute of `feDisplacementMap`. Standard mode uses negative values (scale × -1). Shader mode uses positive. Set to 0 for small circular elements to avoid SVG filter artifacts.

6. **Default values**: `displacementScale=70`, `blurAmount=0.0625` (→ 2px blur), `saturation=140%`, `aberrationIntensity=2`, `elasticity=0.15`, `cornerRadius=999` (pill), `padding="24px 32px"`.
