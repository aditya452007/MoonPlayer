/**
 * WaveformVisualizer
 * Renders a single HTML5 Canvas element instead of 64 separate divs.
 * This completely avoids any DOM modifications or React reconciliation cycles at 60fps.
 */
export function WaveformVisualizer({ canvasRef }) {
  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        display: 'block' 
      }} 
    />
  );
}
