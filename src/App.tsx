import { useRef, useState } from 'react'
import GlassLayer from './glass-effect'

/* ── Inline SVG Icons ── */
const icons = {
  home: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  settings: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  bell: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
  camera: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  music: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  heart: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  ),
  share: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  ),
  bookmark: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </svg>
  ),
  search: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  star: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
}

const iconGrid = [
  { icon: icons.home, label: 'Home' },
  { icon: icons.settings, label: 'Settings' },
  { icon: icons.bell, label: 'Notifications' },
  { icon: icons.camera, label: 'Camera' },
  { icon: icons.music, label: 'Music' },
  { icon: icons.heart, label: 'Favorites' },
] as const

const fabActions = [
  { icon: icons.share, label: 'Share' },
  { icon: icons.bookmark, label: 'Save' },
  { icon: icons.search, label: 'Search' },
  { icon: icons.star, label: 'Rate' },
] as const

function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [fabOpen, setFabOpen] = useState(false)

  return (
    <div ref={containerRef} style={{ position: 'relative', minHeight: '100vh' }}>

      {/* ── Gradient mesh background ── */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        background: `
          radial-gradient(ellipse 80% 60% at 20% 30%, rgba(88, 28, 135, 0.5) 0%, transparent 70%),
          radial-gradient(ellipse 70% 50% at 75% 60%, rgba(15, 23, 42, 0.8) 0%, transparent 70%),
          radial-gradient(ellipse 60% 80% at 50% 80%, rgba(30, 64, 175, 0.4) 0%, transparent 70%),
          radial-gradient(ellipse 90% 40% at 80% 20%, rgba(14, 116, 144, 0.3) 0%, transparent 60%),
          linear-gradient(135deg, #0a0a1a 0%, #0f172a 40%, #1e1b4b 100%)
        `,
      }} />

      {/* ── Content wrapper ── */}
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* ── Hero Section ── */}
        <section style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          gap: '20px',
          paddingTop: '80px',
        }}>
          {/* Eyebrow */}
          <GlassLayer
            mouseContainer={containerRef}
            displacementScale={30}
            blurAmount={0.04}
            saturation={120}
            aberrationIntensity={0.5}
            cornerRadius={999}
            padding="8px 20px"
            elasticity={0.1}
          >
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              ✦ Glass Effect Component
            </span>
          </GlassLayer>

          {/* Main title card */}
          <GlassLayer
            mouseContainer={containerRef}
            displacementScale={50}
            blurAmount={0.05}
            saturation={115}
            aberrationIntensity={1}
            elasticity={0.2}
            cornerRadius={24}
            padding="48px 64px"
          >
            <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
              <h1 style={{
                margin: 0,
                fontSize: '40px',
                fontWeight: 700,
                color: 'white',
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
              }}>
                Liquid Glass
              </h1>
              <p style={{
                margin: '10px 0 0',
                fontSize: '16px',
                fontWeight: 400,
                color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.5,
              }}>
                Realistic frosted glass with chromatic aberration,<br />
                edge refraction, and spring physics.
              </p>
            </div>
          </GlassLayer>
        </section>

        {/* ── Glass Icon Grid ── */}
        <section style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          padding: '40px 20px 60px',
        }}>
          <h2 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            Interactive Glass Buttons
          </h2>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            justifyContent: 'center',
            maxWidth: '600px',
          }}>
            {iconGrid.map(({ icon, label }) => (
              <GlassLayer
                key={label}
                mouseContainer={containerRef}
                displacementScale={35}
                blurAmount={0.04}
                saturation={130}
                aberrationIntensity={0.8}
                elasticity={0.15}
                cornerRadius={16}
                padding="16px 24px"
                onClick={() => console.log(`${label} clicked`)}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  pointerEvents: 'none',
                  color: 'white',
                }}>
                  {icon}
                  <span style={{ fontSize: '15px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {label}
                  </span>
                </div>
              </GlassLayer>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '40px 20px 60px',
          marginTop: 'auto',
        }}>
          <GlassLayer
            mouseContainer={containerRef}
            displacementScale={20}
            blurAmount={0.03}
            saturation={110}
            aberrationIntensity={0.3}
            cornerRadius={999}
            padding="10px 24px"
            elasticity={0.08}
          >
            <span style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>
              Built with Glass Effect ✦ React + SVG Filters
            </span>
          </GlassLayer>
        </footer>
      </div>

      {/* ── Floating Action Button ── */}
      <div style={{
        position: 'fixed',
        bottom: '32px',
        right: '32px',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
      }}>
        {/* Expanded action buttons */}
        {fabActions.map(({ icon, label }, i) => {
          const total = fabActions.length
          const angle = -90 - (60 / (total - 1)) * i  // Arc from -90° to -150°
          const radius = 80
          const x = fabOpen ? Math.cos((angle * Math.PI) / 180) * radius : 0
          const y = fabOpen ? Math.sin((angle * Math.PI) / 180) * radius : 0

          return (
            <div
              key={label}
              style={{
                position: 'absolute',
                bottom: '0px',
                right: '0px',
                transform: `translate(${x}px, ${y}px) scale(${fabOpen ? 1 : 0.3})`,
                opacity: fabOpen ? 1 : 0,
                transition: `all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) ${fabOpen ? i * 60 : (total - 1 - i) * 40}ms`,
                pointerEvents: fabOpen ? 'auto' : 'none',
              }}
            >
              <GlassLayer
                mouseContainer={containerRef}
                displacementScale={25}
                blurAmount={0.04}
                saturation={140}
                aberrationIntensity={0.6}
                cornerRadius={999}
                padding="14px"
                elasticity={0.12}
                onClick={() => {
                  console.log(`${label} action`)
                  setFabOpen(false)
                }}
              >
                <div style={{ color: 'white', display: 'flex', pointerEvents: 'none' }}>
                  {icon}
                </div>
              </GlassLayer>
            </div>
          )
        })}

        {/* Main FAB button */}
        <GlassLayer
          mouseContainer={containerRef}
          displacementScale={40}
          blurAmount={0.05}
          saturation={150}
          aberrationIntensity={1.2}
          cornerRadius={999}
          padding="18px"
          elasticity={0.15}
          onClick={() => setFabOpen((prev) => !prev)}
        >
          <div style={{
            color: 'white',
            display: 'flex',
            pointerEvents: 'none',
            transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
        </GlassLayer>
      </div>

      {/* Backdrop click to close FAB */}
      {fabOpen && (
        <div
          onClick={() => setFabOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 49,
          }}
        />
      )}
    </div>
  )
}

export default App
