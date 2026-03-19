import { useRef, useState } from 'react'
import GlassLayer from './glass-effect'

const backgrounds = [
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80',
  'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=1920&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80',
]

/* ── Slider Component ── */
function Slider({ label, value, onChange, min, max, step = 1, unit = '' }: {
  label: string; value: number; onChange: (v: number) => void
  min: number; max: number; step?: number; unit?: string
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 6, fontSize: 12, fontWeight: 500, letterSpacing: '0.03em',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' as const }}>{label}</span>
        <span style={{ color: 'rgba(255,255,255,0.9)', fontVariantNumeric: 'tabular-nums' }}>
          {step < 1 ? value.toFixed(step < 0.01 ? 3 : 2) : value}{unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: 'rgba(255,255,255,0.7)' }}
      />
    </div>
  )
}

function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  // Editable glass params
  const [displacementScale, setDisplacementScale] = useState(50)
  const [blurAmount, setBlurAmount] = useState(0.05)
  const [saturation, setSaturation] = useState(115)
  const [aberration, setAberration] = useState(1)
  const [elasticity, setElasticity] = useState(0.2)
  const [cornerRadius, setCornerRadius] = useState(20)

  return (
    <div ref={containerRef}>
      {/* Scrollable background sections */}
      {backgrounds.map((bg, i) => (
        <div
          key={i}
          style={{
            width: '100%',
            height: '100vh',
            backgroundImage: `url(${bg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      ))}

      {/* ── Toggle Button (fixed top-left) ── */}
      <button
        onClick={() => setPanelOpen(p => !p)}
        style={{
          position: 'fixed',
          top: 20,
          left: 20,
          zIndex: 100,
          width: 40,
          height: 40,
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: panelOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      </button>

      {/* ── Editor Panel ── */}
      <div style={{
        position: 'fixed',
        top: 72,
        left: 20,
        zIndex: 99,
        width: 240,
        padding: panelOpen ? '20px 20px 12px' : '0 20px',
        maxHeight: panelOpen ? 500 : 0,
        opacity: panelOpen ? 1 : 0,
        overflow: 'hidden',
        borderRadius: 16,
        background: 'rgba(10,10,10,0.65)',
        backdropFilter: 'blur(40px) saturate(120%)',
        WebkitBackdropFilter: 'blur(40px) saturate(120%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        pointerEvents: panelOpen ? 'auto' : 'none',
      }}>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.35)',
          marginBottom: 16,
        }}>
          Glass Editor
        </div>

        <Slider label="Displacement" value={displacementScale} onChange={setDisplacementScale}
          min={0} max={150} />
        <Slider label="Blur" value={blurAmount} onChange={setBlurAmount}
          min={0} max={0.5} step={0.005} />
        <Slider label="Saturation" value={saturation} onChange={setSaturation}
          min={100} max={250} unit="%" />
        <Slider label="Aberration" value={aberration} onChange={setAberration}
          min={0} max={5} step={0.1} />
        <Slider label="Elasticity" value={elasticity} onChange={setElasticity}
          min={0} max={0.6} step={0.01} />
        <Slider label="Radius" value={cornerRadius} onChange={setCornerRadius}
          min={0} max={999} unit="px" />

        {/* Reset button */}
        <button
          onClick={() => {
            setDisplacementScale(50); setBlurAmount(0.05); setSaturation(115)
            setAberration(1); setElasticity(0.2); setCornerRadius(20)
          }}
          style={{
            width: '100%',
            marginTop: 4,
            padding: '8px 0',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.5)',
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
          }}
        >
          Reset Defaults
        </button>
      </div>

      {/* ── Glass Card (uses editor values) ── */}
      <GlassLayer
        mouseContainer={containerRef}
        displacementScale={displacementScale}
        blurAmount={blurAmount}
        saturation={saturation}
        aberrationIntensity={aberration}
        elasticity={elasticity}
        cornerRadius={cornerRadius}
        padding="40px 56px"
        style={{ position: 'fixed', top: '50%', left: '50%' }}
      >
        <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
          <h1 style={{
            margin: 0,
            fontSize: '32px',
            fontWeight: 700,
            color: 'white',
            letterSpacing: '-0.02em',
          }}>
            Liquid Glass
          </h1>
          <p style={{
            margin: '6px 0 0',
            fontSize: '15px',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.75)',
          }}>
            Scroll through the backgrounds
          </p>
        </div>
      </GlassLayer>
    </div>
  )
}

export default App
