import { useRef, useState } from 'react'
import GlassLayer from './glass-effect'

const backgrounds = [
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80',
  'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=1920&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80',
]

/* ── SVG Icons ── */
const PlusIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)
const ShareIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)
const BookmarkIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
  </svg>
)
const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
const StarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const fabActions = [
  { Icon: ShareIcon, label: 'Share' },
  { Icon: BookmarkIcon, label: 'Save' },
  { Icon: SearchIcon, label: 'Search' },
  { Icon: StarIcon, label: 'Star' },
]

function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [fabOpen, setFabOpen] = useState(false)

  // FAB center position (fixed, bottom-right)
  const fabLeft = 'calc(100vw - 60px)'
  const fabTop = 'calc(100vh - 60px)'

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

      {/* Single fixed glass card in center */}
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

      {/* ── Backdrop to close FAB ── */}
      {fabOpen && (
        <div
          onClick={() => setFabOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 50 }}
        />
      )}

      {/* ── FAB action items (expand upward) ── */}
      {fabActions.map(({ Icon, label }, i) => (
        <div
          key={label}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 51,
            opacity: fabOpen ? 1 : 0,
            transition: `opacity 0.3s ease ${fabOpen ? i * 60 : (fabActions.length - 1 - i) * 30}ms`,
            pointerEvents: fabOpen ? 'auto' : 'none',
            visibility: fabOpen ? 'visible' : 'hidden',
          }}
        >
          <GlassLayer
            mouseContainer={containerRef}
            displacementScale={0}
            blurAmount={0.06}
            saturation={115}
            aberrationIntensity={0}
            cornerRadius={999}
            padding="22px"
            elasticity={0.15}
            onClick={() => {
              console.log(`${label} clicked`)
              setFabOpen(false)
            }}
            style={{
              position: 'fixed',
              top: fabOpen
                ? `calc(${fabTop} - ${(i + 1) * 72}px)`
                : fabTop,
              left: fabLeft,
            }}
          >
            <div style={{ color: 'white', display: 'flex', pointerEvents: 'none' }}>
              <Icon />
            </div>
          </GlassLayer>
        </div>
      ))}

      {/* ── Main FAB + button ── */}
      <GlassLayer
        mouseContainer={containerRef}
        displacementScale={0}
        blurAmount={0.06}
        saturation={115}
        aberrationIntensity={0}
        cornerRadius={999}
        padding="22px"
        elasticity={0.2}
        onClick={() => setFabOpen(prev => !prev)}
        style={{ position: 'fixed', top: fabTop, left: fabLeft, zIndex: 52 }}
      >
        <div style={{
          color: 'white',
          display: 'flex',
          pointerEvents: 'none',
          transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)',
        }}>
          <PlusIcon />
        </div>
      </GlassLayer>
    </div>
  )
}

export default App
