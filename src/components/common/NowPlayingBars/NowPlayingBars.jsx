import { useRef, useEffect } from 'react';
import { visualizerEngine } from '../../../core/audio/VisualizerEngine';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

export function NowPlayingBars({ isPlaying, barCount = 5, className = '' }) {
  const canvasRef = useRef(null);
  const reqRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let color;
      try {
        color = window.getComputedStyle(document.documentElement).getPropertyValue('--accent-moon').trim() || '#6BA3D6';
      } catch {
        color = '#6BA3D6';
      }

      if (isPlaying && !prefersReducedMotion) {
        const data = visualizerEngine.getFrequencyData(true);
        const barWidth = canvas.width / barCount;
        const gap = 2;
        const effectiveBarWidth = barWidth - gap;

        for (let i = 0; i < barCount; i++) {
          const binIndex = Math.floor((i / barCount) * 20);
          const raw = data[binIndex] || 0;
          const amplitude = Math.max(0.05, raw / 255);
          const barHeight = canvas.height * amplitude;
          const x = i * barWidth + gap / 2;
          const y = canvas.height - barHeight;

          ctx.fillStyle = color;
          ctx.globalAlpha = 0.8;

          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x, y, effectiveBarWidth, barHeight, [1, 1, 0, 0]);
          } else {
            ctx.rect(x, y, effectiveBarWidth, barHeight);
          }
          ctx.fill();
        }
      } else {
        const barWidth = canvas.width / barCount;
        const gap = 2;
        const effectiveBarWidth = barWidth - gap;
        for (let i = 0; i < barCount; i++) {
          const staticHeight = canvas.height * 0.08;
          const x = i * barWidth + gap / 2;
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.3;
          ctx.fillRect(x, canvas.height - staticHeight, effectiveBarWidth, staticHeight);
        }
      }

      reqRef.current = requestAnimationFrame(loop);
    };

    reqRef.current = requestAnimationFrame(loop);
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [isPlaying, barCount, prefersReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={`now-playing-bars ${className}`}
      width={40}
      height={16}
      style={{ width: 40, height: 16, display: 'block' }}
    />
  );
}

export default NowPlayingBars;
