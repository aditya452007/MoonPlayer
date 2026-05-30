import { useEffect, useRef } from 'react';
import { visualizerEngine } from '../../../core/audio/VisualizerEngine';

/**
 * StardustConstellationVisualizer (replaces AuroraVisualizer)
 * Renders a highly optimized 2D canvas particle grid simulating an interactive star cluster.
 * Particles float, expand, accelerate on bass beats, and draw subtle connected lines
 * forming constellation grids that glow and pulse in sync with the audio spectrum.
 */
export function AuroraVisualizer({ baseColor }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let particles = [];
    const maxParticles = 90;
    const connectionDist = 110;

    // Handle responsive resize of drawing buffer
    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Populate star cluster with coordinates, velocity vector, scale, and dynamic reactivity band
    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.6,
        alpha: Math.random() * 0.5 + 0.3,
        band: i % 3, // 0 = Bass (low), 1 = Mid, 2 = Treble (high)
      });
    }

    const draw = () => {
      // Standard dark void trailing blur effect for fluid cosmic stardust movement
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Fetch live frequency bins from VisualizerEngine
      const data = visualizerEngine.getFrequencyData(true);

      // Aggregate frequency spectrum bands to calculate beat levels
      let bass = 0;
      let mid = 0;
      let treble = 0;

      for (let i = 0; i < 8; i++) bass += data[i] || 0;
      for (let i = 8; i < 24; i++) mid += data[i] || 0;
      for (let i = 24; i < 48; i++) treble += data[i] || 0;

      bass = bass / 8 / 255;
      mid = mid / 16 / 255;
      treble = treble / 24 / 255;

      const color = baseColor || '#6BA3D6';

      // 1. Draw and update star particles
      particles.forEach((p) => {
        let speedMult = 1.0;
        let scale = 1.0;

        // Apply audio reactivity depending on particle band
        if (p.band === 0) {
          speedMult += bass * 2.2;
          scale += bass * 1.4;
        } else if (p.band === 1) {
          speedMult += mid * 1.8;
          scale += mid * 1.1;
        } else {
          speedMult += treble * 2.8;
          scale += treble * 1.8;
        }

        // Move particle along its velocity vector
        p.x += p.vx * speedMult;
        p.y += p.vy * speedMult;

        // Boundary wrap logic
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw individual star circle
        ctx.beginPath();
        const currentRadius = p.r * scale;
        ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);

        // Render soft glow shadows on high beats
        if (currentRadius > 2.0) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = color;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fillStyle = color;
        ctx.globalAlpha = Math.min(1.0, p.alpha * (0.4 + (p.band === 0 ? bass : p.band === 1 ? mid : treble) * 0.6));
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadows for performance
      });

      // 2. Draw connecting constellation grid lines
      for (let i = 0; i < maxParticles; i++) {
        for (let j = i + 1; j < maxParticles; j++) {
          const p1 = particles[i];
          const p2 = particles[j];

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDist) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);

            // Connective line transparency drops off by distance and glows under mid frequencies
            const alphaFactor = (1 - dist / connectionDist);
            const lineOpacity = alphaFactor * 0.12 * (1 + mid * 1.4);

            ctx.strokeStyle = color;
            ctx.globalAlpha = Math.min(0.35, lineOpacity);
            ctx.lineWidth = 0.4 + alphaFactor * 0.6;
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1.0; // Reset opacity scale
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [baseColor]);

  return (
    <canvas 
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        background: 'transparent',
      }}
    />
  );
}
