import { useRef } from 'react'
import LiquidGlass from './liquid-glass/index'

const backgrounds = [
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80',
  'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=1920&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80',
]

function App() {
  const containerRef = useRef<HTMLDivElement>(null)

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
      <LiquidGlass
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
      </LiquidGlass>
    </div>
  )
}

export default App
