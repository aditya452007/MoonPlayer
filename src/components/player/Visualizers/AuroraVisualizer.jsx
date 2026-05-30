import { m } from 'framer-motion';

export function AuroraVisualizer({ bass, mid, treble, baseColor }) {
  // Aurora consists of large blurred glowing orbs that pulse.
  // Bass drives the scale of Orb 1.
  // Mid drives the scale of Orb 2.
  // Treble drives the scale of Orb 3.

  const bassScale = 1 + (bass / 255) * 0.5;
  const midScale = 1 + (mid / 255) * 0.5;
  const trebleScale = 1 + (treble / 255) * 0.5;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', filter: 'blur(10px)' }}>
      {/* Bass Orb - Top Left */}
      <m.div
        animate={{ 
          scale: bassScale, 
          opacity: 0.4 + (bass / 255) * 0.4,
          x: [0, 30, -20, 0],
          y: [0, -20, 30, 0]
        }}
        transition={{ x: { duration: 10, repeat: Infinity }, y: { duration: 12, repeat: Infinity }, scale: { duration: 0.1 } }}
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '60vw',
          height: '60vw',
          borderRadius: '50%',
          backgroundColor: baseColor,
          mixBlendMode: 'screen'
        }}
      />

      {/* Mid Orb - Bottom Right */}
      <m.div
        animate={{ 
          scale: midScale, 
          opacity: 0.3 + (mid / 255) * 0.4,
          x: [0, -40, 20, 0],
          y: [0, 30, -30, 0]
        }}
        transition={{ x: { duration: 15, repeat: Infinity }, y: { duration: 14, repeat: Infinity }, scale: { duration: 0.1 } }}
        style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-10%',
          width: '50vw',
          height: '50vw',
          borderRadius: '50%',
          backgroundColor: 'var(--primary)', // secondary color
          mixBlendMode: 'screen'
        }}
      />

      {/* Treble Orb - Center */}
      <m.div
        animate={{ 
          scale: trebleScale, 
          opacity: 0.2 + (treble / 255) * 0.3,
          rotate: [0, 180, 360]
        }}
        transition={{ rotate: { duration: 20, repeat: Infinity, ease: 'linear' }, scale: { duration: 0.1 } }}
        style={{
          position: 'absolute',
          top: '20%',
          left: '25%',
          width: '50vw',
          height: '30vw',
          borderRadius: '50%',
          backgroundColor: '#fff',
          mixBlendMode: 'overlay'
        }}
      />
    </div>
  );
}

