import { useEffect, useRef } from 'react';
import { visualizerEngine } from '../../../core/audio/VisualizerEngine';
import { WaveformVisualizer } from './WaveformVisualizer';
import { AuroraVisualizer } from './AuroraVisualizer';

/**
 * VisualizerContainer
 * Coordinates high-frequency visualizer animations.
 * Completely eliminates React state updates at 60fps.
 * Uses a single requestAnimationFrame loop to directly render onto
 * Canvas 2D or update CSS custom properties on the wrapper node.
 */
export function VisualizerContainer({ type, isPlaying, baseColor }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const reqRef = useRef(null);

  useEffect(() => {
    // Initialize the visualizer audio nodes
    visualizerEngine.init();

    const loop = () => {
      const data = visualizerEngine.getFrequencyData(isPlaying);

      // 1. Waveform Canvas Renderer (60fps DOM bypass)
      if (type === 'waveform' && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Adjust canvas internal dimensions to match display layout size
          if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
          }
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          const barCount = 64;
          const gap = 2;
          const padding = 32; // Horizontal margins
          const availableWidth = Math.max(100, canvas.width - padding);
          const barWidth = (availableWidth / barCount) - gap;
          
          ctx.fillStyle = baseColor || '#FF4081';
          ctx.globalAlpha = 0.8;
          
          for (let i = 0; i < barCount; i++) {
            const val = data[i] || 0;
            const scaleY = Math.max(0.02, val / 255);
            const barHeight = canvas.height * scaleY;
            const x = (padding / 2) + i * (barWidth + gap);
            const y = canvas.height - barHeight;
            
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
            } else {
              ctx.rect(x, y, barWidth, barHeight);
            }
            ctx.fill();
          }
        }
      }

      // 2. Aurora CSS Custom Property Driver (60fps DOM bypass)
      if (type === 'aurora' && containerRef.current) {
        let bassSum = 0, midSum = 0, trebleSum = 0;
        
        // Sum frequency bins
        for (let i = 0; i < 10; i++) bassSum += data[i] || 0;
        for (let i = 10; i < 30; i++) midSum += data[i] || 0;
        for (let i = 30; i < 60; i++) trebleSum += data[i] || 0;

        const bass = bassSum / 10;
        const mid = midSum / 20;
        const treble = trebleSum / 30;

        const bassScale = 1 + (bass / 255) * 0.5;
        const bassOpacity = 0.4 + (bass / 255) * 0.4;
        const midScale = 1 + (mid / 255) * 0.5;
        const midOpacity = 0.3 + (mid / 255) * 0.4;
        const trebleScale = 1 + (treble / 255) * 0.5;
        const trebleOpacity = 0.2 + (treble / 255) * 0.3;

        const style = containerRef.current.style;
        style.setProperty('--bass-scale', bassScale);
        style.setProperty('--bass-opacity', bassOpacity);
        style.setProperty('--mid-scale', midScale);
        style.setProperty('--mid-opacity', midOpacity);
        style.setProperty('--treble-scale', trebleScale);
        style.setProperty('--treble-opacity', trebleOpacity);
      }

      reqRef.current = requestAnimationFrame(loop);
    };

    reqRef.current = requestAnimationFrame(loop);

    return () => {
      if (reqRef.current) {
        cancelAnimationFrame(reqRef.current);
      }
      // Memory cleanup: safely disconnect and destroy the analyser nodes
      visualizerEngine.destroy();
    };
  }, [isPlaying, type, baseColor]);

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        zIndex: 0, 
        pointerEvents: 'none' 
      }}
    >
      {type === 'waveform' && (
        <WaveformVisualizer canvasRef={canvasRef} />
      )}
      {type === 'aurora' && (
        <AuroraVisualizer baseColor={baseColor} />
      )}
    </div>
  );
}
