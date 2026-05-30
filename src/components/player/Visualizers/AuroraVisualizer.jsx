import { m } from 'framer-motion';

/**
 * AuroraVisualizer
 * Renders large blurred glowing orbs that pulse.
 * Uses vmin units to prevent horizontal overflow and scrollbars.
 * Separates slow float translations (Framer Motion) from high-frequency
 * scale and opacity animations (driven via CSS variables at 60fps on the GPU).
 */
export function AuroraVisualizer({ baseColor }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', filter: 'blur(10px)' }}>
      {/* Bass Orb - Top Left */}
      <m.div
        animate={{ 
          x: [0, 30, -20, 0],
          y: [0, -20, 30, 0]
        }}
        transition={{ x: { duration: 10, repeat: Infinity }, y: { duration: 12, repeat: Infinity } }}
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '60vmin',
          height: '60vmin',
        }}
      >
        <div 
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            backgroundColor: baseColor,
            mixBlendMode: 'screen',
            transform: 'scale(var(--bass-scale, 1))',
            opacity: 'var(--bass-opacity, 0.4)',
            willChange: 'transform, opacity',
            transition: 'transform 0.1s ease-out, opacity 0.1s ease-out'
          }}
        />
      </m.div>

      {/* Mid Orb - Bottom Right */}
      <m.div
        animate={{ 
          x: [0, -40, 20, 0],
          y: [0, 30, -30, 0]
        }}
        transition={{ x: { duration: 15, repeat: Infinity }, y: { duration: 14, repeat: Infinity } }}
        style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-10%',
          width: '50vmin',
          height: '50vmin',
        }}
      >
        <div 
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            mixBlendMode: 'screen',
            transform: 'scale(var(--mid-scale, 1))',
            opacity: 'var(--mid-opacity, 0.3)',
            willChange: 'transform, opacity',
            transition: 'transform 0.1s ease-out, opacity 0.1s ease-out'
          }}
        />
      </m.div>

      {/* Treble Orb - Center */}
      <m.div
        animate={{ 
          rotate: [0, 180, 360]
        }}
        transition={{ rotate: { duration: 20, repeat: Infinity, ease: 'linear' } }}
        style={{
          position: 'absolute',
          top: '20%',
          left: '25%',
          width: '50vmin',
          height: '30vmin',
        }}
      >
        <div 
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            backgroundColor: '#fff',
            mixBlendMode: 'overlay',
            transform: 'scale(var(--treble-scale, 1))',
            opacity: 'var(--treble-opacity, 0.2)',
            willChange: 'transform, opacity',
            transition: 'transform 0.1s ease-out, opacity 0.1s ease-out'
          }}
        />
      </m.div>
    </div>
  );
}
